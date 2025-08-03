import React from 'react';
import { Calendar, User, AlertCircle } from 'lucide-react';

const TaskCard = ({ task, onClick }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'todo':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'done':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div
      className="task-card"
      onClick={() => onClick(task)}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-medium text-gray-900 line-clamp-2">{task.title}</h3>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          {task.assigned_to_name && (
            <div className="flex items-center">
              <User className="w-3 h-3 mr-1" />
              {task.assigned_to_name}
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(task.created_at)}
          </div>
        </div>
        
        {task.priority === 'high' && (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
    </div>
  );
};

export default TaskCard;