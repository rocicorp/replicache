import Replicache, {WriteTransaction} from 'replicache';

import {
  batchURL,
  clientViewURL,
  dataLayerAuth,
  diffServerAuth,
  diffServerURL,
} from './settings';
import type {EventIdentity, Event, EventUpdate} from './types';

export const rep = new Replicache({
  batchURL,
  clientViewURL,
  dataLayerAuth,
  diffServerAuth,
  diffServerURL,
});

function eventKey(event: EventIdentity) {
  return `/event/${event.id}`;
}

export const addEvent = rep.register(
  'addEvent',
  async (tx: WriteTransaction, event: Event) => {
    await tx.put(eventKey(event), event);
  },
);

export const updateEvent = rep.register(
  'updateEvent',
  async (tx: WriteTransaction, update: EventUpdate) => {
    const event = (await tx.get(eventKey(update))) as Event | null;
    if (!event) {
      console.warn(`Possible conflict - event ${update.id} not found`);
      return;
    }
    event.summary = update.summary ?? event.summary;
    event.start = update.start ?? event.start;
    event.end = update.end ?? event.end;
    await tx.put(eventKey(event), event);
  },
);

export const deleteEvent = rep.register(
  'deleteEvent',
  async (tx: WriteTransaction, id: EventIdentity) => {
    await tx.del(eventKey(id));
  },
);
