export type EventIdentity = {
  id: string;
};

export type Event = EventIdentity & {
  summary: string;
  start?: EventDate;
  end?: EventDate;
};

export type EventUpdate = EventIdentity & Partial<Event>;

export type NormalizedEvent = Event & {
  start: Date;
  end: Date;
};

export type EventDate = {
  date?: string;
  dateTime?: string;
};
