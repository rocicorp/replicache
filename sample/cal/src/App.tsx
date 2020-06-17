import React, {useEffect, useRef, useState} from 'react';
import './App.css';

import Replicache, {
  REPMHTTPInvoker,
  ReadTransaction,
  WriteTransaction,
  Mutator,
} from 'replicache';
import {
  dataLayerAuth,
  diffServerURL,
  diffServerAuth,
  batchURL,
} from './settings';

import add from 'date-fns/add'
import setDay from 'date-fns/setDay';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import format from 'date-fns/format';

import uuid from 'uuid-random';

const repmInvoke = new REPMHTTPInvoker('http://localhost:7002').invoke;

const rep = new Replicache({
  diffServerURL,
  dataLayerAuth,
  diffServerAuth,
  batchURL,
  repmInvoke,
});

function eventKey(event: EventIdentity) {
  return `/event/${event.calendarID}/${event.id}`;
}

const addEvent = rep.register('addEvent', async (tx: WriteTransaction, event: Event) => {
  await tx.put(eventKey(event), event);
});

const updateEvent = rep.register('updateEvent', async (tx: WriteTransaction, update: EventUpdate) => {
  const event = (await tx.get(eventKey(update))) as Event|null;
  if (!event) {
    console.warn(`Possible conflict - event ${update.id} not found`);
    return;
  }
  event.summary = update.summary ?? event.summary;
  event.start = update.start ?? event.start;
  event.end = update.end ?? event.end;
  await tx.put(eventKey(event), event);
});

const deleteEvent = rep.register('deleteEvent', async (tx: WriteTransaction, id: EventIdentity) => {
  await tx.del(eventKey(id));
});

function App() {
  const events = useSubscribe(async (tx: ReadTransaction) => {
    // TODO: Scan API needs improvement.
    // See https://github.com/rocicorp/replicache-sdk-js/issues/30.
    const res = Array.from(await tx.scan({prefix: '/event/', limit: 50000}));
    const result = res.map(item => {
      let event = item.value as Event;
      if (!event.start || !event.end) {
        return null;
      }
      let normalized = item.value as unknown as NormalizedEvent;
      normalized.start = eventDate(event.start);
      normalized.end = eventDate(event.end);
      return normalized;
    }).filter(item => {
      if (!item) {
        return false;
      }
      const now = new Date();
      const viewInterval = {
        start: setDay(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime(), 0),
        end: setDay(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime(), 6),
      };
      return areIntervalsOverlapping(item, viewInterval);
    }) as NormalizedEvent[];
    result.sort((a, b) => a.start.getTime() - b.start.getTime());
    return result;
  }, [], []);

  return (
    <div className="App">
      <header className="App-header">
        This Week's Agenda<br/>
        <SyncButton/>
        <NewEventButton/>
      </header>
      <List events={events} />
    </div>
  );
}

export default App;

type EventIdentity = {
  id: string;
  calendarID: string;
};

type Event = EventIdentity & {
  summary: string;
  start?: EventDate;
  end?: EventDate;
}

type EventUpdate = EventIdentity & Partial<Event>;

type NormalizedEvent = Event & {
  start: Date;
  end: Date;
}

type EventDate = {
  date?: string;
  dateTime?: string;
};

function List({events}: {events: NormalizedEvent[]}) {
  return (
    <ul className="App-list">
      {events.map(event => (
        <ListItem key={`${event.calendarID}/${event.id}`} event={event} />
      ))}
    </ul>
  );
}

function ListItem({event}: {event: NormalizedEvent}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSummaryBlur = () => {
    if (!inputRef.current || inputRef.current.value == event.summary) {
      return;
    }
    updateEvent({
      id: event.id,
      calendarID: event.calendarID,
      summary: inputRef.current.value || '',
    });
  };
  const handleDelete = () => {
    deleteEvent(event);
  };
  return <div style={{marginBottom:'1em'}}>
    <span style={{color:'#999'}}>{`${format(event.start, 'PPpp')}`}</span><br/>
    <input ref={inputRef} onBlur={handleSummaryBlur} defaultValue={event.summary}/>
    <button onClick={handleDelete}>🗑</button>
  </div>;
}

function SyncButton() {
  const [syncing, setSyncing] = useState<boolean>(false);
  useEffect(() => {
    rep.onSync = (syncing) => setSyncing(syncing);
  }, []);
  return <button onClick={() => rep.sync()} disabled={syncing}>
    {syncing ? "Syncing..." : "Sync"}
  </button>
}

function NewEventButton() {
  const handleClick = async () => {
    const start = add(new Date(), {hours:1});
    const end = add(start, {hours:1});
    const calendarID = await rep.get('/user/primary') as string;
    addEvent({
      calendarID,
      id: uuid().replace(/\-/g, ''),
      summary: 'Untitled Event',
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    });
  };
  return <button onClick={() => handleClick()}>New Event</button>
}

function useSubscribe<R>(query: (tx: ReadTransaction) => Promise<R>, def: R, deps?: any[]) {
  const [snapshot, setSnapshot] = useState<R>(def);
  useEffect(() => {
    return rep.subscribe(query, {onData: setSnapshot});
  }, deps);
  return snapshot;
}

function eventDate(d: EventDate) {
  return new Date(Date.parse(d.dateTime || d.date || ''));
}
