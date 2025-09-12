export type ParsedEvent = {
  title: string;
  allDay: boolean;
  startDate: string; 
  endDate?: string; 
  startTime?: string; 
  endTime?: string; 
  timezone?: string; 
  description?: string;
};

export type TaskEvent = ParsedEvent & {
  id: string; 
  completed: boolean;
};


