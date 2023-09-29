import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Tab } from '@mui/material';
import React, { useState } from 'react';

import type { EventStore } from '@castore/core';

import { EventStoreDB } from './EventStoreDB';

export const DB = ({
  eventStoreIds,
  eventStoresById,
}: {
  eventStoreIds: string[];
  eventStoresById: Record<string, EventStore>;
}): JSX.Element => {
  const [selectedEventStoreId, selectEventStoreId] = useState(eventStoreIds[0]);

  if (selectedEventStoreId === undefined) return <></>;

  return (
    <TabContext value={selectedEventStoreId}>
      <TabList
        onChange={(_, eventStoreId: string) => {
          selectEventStoreId(eventStoreId);
        }}
        aria-label="Event-store section"
        centered
      >
        {eventStoreIds.map(eventStoreId => (
          <Tab key={eventStoreId} label={eventStoreId} value={eventStoreId} />
        ))}
      </TabList>
      {eventStoreIds.map(eventStoreId => {
        const eventStore = eventStoresById[eventStoreId];

        if (eventStore === undefined) return <></>;

        return (
          <TabPanel key={eventStoreId} value={eventStoreId}>
            <EventStoreDB eventStore={eventStore} />
          </TabPanel>
        );
      })}
    </TabContext>
  );
};
