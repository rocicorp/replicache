import React, {useCallback} from 'react';
import './ListListItem.css';

type Id = number;

type ListListItemProps = {
  id: Id;
  onClick: (id: Id) => void;
  selected: boolean;
};

export const ListListItem = ({
  id,
  onClick,
  selected,
}: ListListItemProps): JSX.Element => {
  const onClickCallback = useCallback(() => onClick(id), [id]);
  const title = `List ${id}`;
  return (
    <li className={'ListListItem ' + (selected ? 'selected' : '')}>
      <button onClick={onClickCallback} title={title}>
        {title}
      </button>
    </li>
  );
};
