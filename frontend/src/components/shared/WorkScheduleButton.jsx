import React from 'react';
import { Button, useDisclosure } from '@chakra-ui/react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import WorkScheduleModal from './WorkScheduleModal';

const WorkScheduleButton = ({ userId, userName, variant = 'outline', size = 'md', colorScheme = 'blue' }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button
        leftIcon={<CalendarDaysIcon className="h-5 w-5" />}
        onClick={onOpen}
        variant={variant}
        size={size}
        colorScheme={colorScheme}
      >
        Work Schedule
      </Button>

      <WorkScheduleModal
        isOpen={isOpen}
        onClose={onClose}
        userId={userId}
        userName={userName}
      />
    </>
  );
};

export default WorkScheduleButton;
