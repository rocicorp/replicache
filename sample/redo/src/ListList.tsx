import React from 'react';

import './ListList.css';
import {ListListItem} from './ListListItem';

type Id = number;

type ListsProps = {
  listIds: Id[];
  selectedId?: Id | null;
  onClick: (id: Id) => void;
};

export const ListList = ({
  listIds,
  onClick,
  selectedId,
}: ListsProps): JSX.Element => {
  return (
    <ul className="ListList">
      {listIds.map(id => (
        <ListListItem
          key={id}
          id={id}
          onClick={onClick}
          selected={selectedId === id}
        />
      ))}
    </ul>
  );
};
