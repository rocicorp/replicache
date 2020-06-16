import React, {useEffect, useState} from 'react';
import './App.css';

import Replicache, {REPMHTTPInvoker, ReadTransaction} from 'replicache';
import {
  dataLayerAuth,
  diffServerURL,
  diffServerAuth,
  batchURL,
} from './settings';
import setDay from 'date-fns/setDay';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import format from 'date-fns/format';

const repmInvoke = new REPMHTTPInvoker('http://localhost:7002').invoke;

const rep = new Replicache({
  diffServerURL,
  dataLayerAuth,
  diffServerAuth,
  batchURL,
  repmInvoke,
});

function App() {
  const events = useSubscribe(
    async (tx: ReadTransaction) => {
      // TODO: Scan API needs improvement.
      // See https://github.com/rocicorp/replicache-sdk-js/issues/30.
      const result: NormalizedEvent[] = [];

      for await (const scanItem of tx.scan({prefix: '/event/', limit: 50000})) {
        const event = scanItem.value as Event;
        if (!event.start || !event.end) {
          continue;
        }
        const normalized = {
          ...event,
          start: eventDate(event.start),
          end: eventDate(event.end),
        };

        const now = new Date();
        const viewInterval = {
          start: setDay(
            new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            ).getTime(),
            0,
          ),
          end: setDay(
            new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
              23,
              59,
              59,
              999,
            ).getTime(),
            6,
          ),
        };

        if (areIntervalsOverlapping(normalized, viewInterval)) {
          result.push(normalized);
        }
      }

      result.sort((a, b) => a.start.getTime() - b.start.getTime());
      return result;
    },
    [],
    [],
  );

  return (
    <div className="App">
      <header className="App-header">
        This Week's Agenda
        <br />
        <SyncButton />
      </header>
      <List events={events} />
    </div>
  );
}

export default App;

type Event = {
  id: string;
  summary: string;
  start?: EventDate;
  end?: EventDate;
};

type NormalizedEvent = {
  id: string;
  summary: string;
  start: Date;
  end: Date;
};

type EventDate = {
  date?: string;
  dateTime?: string;
};

function List({events}: {events: NormalizedEvent[]}) {
  return (
    <ul className="App-list">
      {events.map(event => (
        <ListItem key={event.id} event={event} />
      ))}
    </ul>
  );
}

function ListItem({event}: {event: NormalizedEvent}) {
  return (
    <div style={{marginBottom: '1em'}}>
      <span style={{color: '#999'}}>{`${format(event.start, 'PPpp')}`}</span>
      <br />
      <b>{event.summary}</b>
    </div>
  );
}

function SyncButton() {
  const [syncing, setSyncing] = useState<boolean>(false);
  useEffect(() => {
    rep.onSync = syncing => setSyncing(syncing);
  }, []);
  return (
    <button onClick={() => rep.sync()} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync'}
    </button>
  );
}

function useSubscribe<R>(
  query: (tx: ReadTransaction) => Promise<R>,
  def: R,
  deps?: any[],
) {
  const [snapshot, setSnapshot] = useState<R>(def);
  useEffect(() => {
    return rep.subscribe(query, {onData: setSnapshot});
  }, deps);
  return snapshot;
}

function eventDate(d: EventDate) {
  return new Date(Date.parse(d.dateTime || d.date || ''));
}
