export type ParsedEvent = {
  title: string;
  allDay: boolean;
  startDate: string; // "YYYY-MM-DD"
  endDate?: string; // "YYYY-MM-DD"
  startTime?: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  timezone?: string; // IANA, e.g., "America/Chicago"
  location?: string;
  description?: string;
};

export type TaskEvent = ParsedEvent & {
  id: string; // uuid
  completed: boolean;
};


