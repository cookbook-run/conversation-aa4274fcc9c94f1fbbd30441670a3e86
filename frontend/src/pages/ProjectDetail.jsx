import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsAPI, tasksAPI } from '../utils/api';
import { Plus, Settings, ArrowLeft, Filter } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projectResponse, tasksResponse] = await Promise.all([
        projectsAPI.getById(id),
        tasksAPI.getByProject(id)
      ]);
      
      setProject(projectResponse.data);
      setTasks(tasksResponse.data);
    } catch (error) {
      console.error('Error loading project data:', error);
      if (error.response?.status === 404) {
        navigate('/projects');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSave = async (taskData) => {
    try {
      if (selectedTask) {
        await tasksAPI.update(selectedTask.id, taskData);
      } else {
        await tasksAPI.create({ ...taskData, project_id: parseInt(id) });
      }
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      loadProjectData();
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      loadProjectData();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    done: filteredTasks.filter(task => task.status === 'done')
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Project not found</h2>
        <button
          onClick={() => navigate('/projects')}
          className="btn btn-primary"
        >
          Back to Projects
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-gray-600 mt-1">{project.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCreateTask}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
          <button className="btn btn-secondary flex items-center">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-3 py-1"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <div className="text-sm text-gray-500">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* To Do Column */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              To Do ({tasksByStatus.todo.length})
            </h3>
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {tasksByStatus.todo.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
              />
            ))}
            {tasksByStatus.todo.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks in this column
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              In Progress ({tasksByStatus.in_progress.length})
            </h3>
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {tasksByStatus.in_progress.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
              />
            ))}
            {tasksByStatus.in_progress.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks in this column
              </div>
            )}
          </div>
        </div>

        {/* Done Column */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">
              Done ({tasksByStatus.done.length})
            </h3>
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
          </div>
          <div className="space-y-3">
            {tasksByStatus.done.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={handleTaskClick}
              />
            ))}
            {tasksByStatus.done.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No tasks in this column
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTask(null);
        }}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        projectMembers={project.members || []}
      />
    </div>
  );
};

export default ProjectDetail;