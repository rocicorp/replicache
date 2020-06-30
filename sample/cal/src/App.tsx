import React, {useEffect, useState, useCallback, DependencyList} from 'react';
import type {ReadTransaction} from 'replicache';
import add from 'date-fns/add';
import setDay from 'date-fns/setDay';
import areIntervalsOverlapping from 'date-fns/areIntervalsOverlapping';
import format from 'date-fns/format';
import uuid from 'uuid-random';
import {pipe, toArray, map, filter} from 'axax/esnext';

import './App.css';
import type {Event, NormalizedEvent, EventDate} from './types';
import {rep, addEvent, updateEvent, deleteEvent} from './data';

export default App;

function App() {
  const events = useSubscribe(
    async (tx: ReadTransaction) => {
      const eventIterable = tx.scan({prefix: '/event/'});
      const result = (await toArray(
        pipe(
          map((event: Event) => {
            if (!event.start || !event.end) {
              return null;
            }
            let normalized = event as NormalizedEvent;
            normalized.start = eventDate(event.start);
            normalized.end = eventDate(event.end);
            return normalized;
          }),
          filter((event: NormalizedEvent | null) => {
            if (!event) {
              return false;
            }
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
            return areIntervalsOverlapping(event, viewInterval);
          }),
        )(eventIterable),
      )) as NormalizedEvent[];
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
        <NewEventButton />
      </header>
      <List events={events} />
    </div>
  );
}

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
  const [summaryEdit, setSummaryEdit] = useState<string | null>(null);
  const handleSummaryBlur = async () => {
    if (summaryEdit == null) {
      return;
    }
    // Wait for the local edit to go through then clear the edit state.
    await updateEvent({
      id: event.id,
      summary: summaryEdit,
    });
    setSummaryEdit(null);
  };
  const handleDelete = () => {
    deleteEvent(event);
  };
  return (
    <div style={{marginBottom: '1em'}}>
      <span style={{color: '#999'}}>{`${format(event.start, 'PPpp')}`}</span>
      <br />
      <input
        value={summaryEdit ?? event.summary}
        onChange={e => setSummaryEdit(e.target.value)}
        onBlur={handleSummaryBlur}
      />
      <button onClick={handleDelete}>🗑</button>
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

function NewEventButton() {
  const handleClick = async () => {
    const start = add(new Date(), {hours: 1});
    const end = add(start, {hours: 1});
    addEvent({
      id: uuid().replace(/-/g, ''),
      summary: 'Untitled Event',
      start: {
        dateTime: start.toISOString(),
      },
      end: {
        dateTime: end.toISOString(),
      },
    });
  };
  return <button onClick={() => handleClick()}>New Event</button>;
}

function useSubscribe<R>(
  query: (tx: ReadTransaction) => Promise<R>,
  def: R,
  deps: DependencyList[] = [],
) {
  const [snapshot, setSnapshot] = useState<R>(def);
  const q = useCallback(query, deps);
  useEffect(() => {
    return rep.subscribe(q, {onData: setSnapshot});
  }, [q]);
  return snapshot;
}

function eventDate(d: EventDate) {
  return new Date(Date.parse(d.dateTime || d.date || ''));
}
