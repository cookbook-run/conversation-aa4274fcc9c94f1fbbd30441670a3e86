import { useDroppable } from '@dnd-kit/core';

interface TaskColumnProps {
  id: string;
  title: string;
  taskCount: number;
  children: React.ReactNode;
  onAddTask: () => void;
}

export default function TaskColumn({ id, title, taskCount, children, onAddTask }: TaskColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-100 rounded-lg p-4 ${isOver ? 'ring-2 ring-blue-400' : ''}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">
          {title} <span className="text-sm text-gray-500">({taskCount})</span>
        </h3>
        <button
          onClick={onAddTask}
          className="text-gray-500 hover:text-gray-700"
          title="Add task"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div className="space-y-3 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}