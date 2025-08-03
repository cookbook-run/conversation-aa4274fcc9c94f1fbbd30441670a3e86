import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, tasksAPI } from '../utils/api';
import { FolderOpen, CheckSquare, Clock, AlertCircle, Plus } from 'lucide-react';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load projects
      const projectsResponse = await projectsAPI.getAll();
      const projectsData = projectsResponse.data;
      setProjects(projectsData);

      // Load tasks from all projects
      const allTasks = [];
      for (const project of projectsData) {
        try {
          const tasksResponse = await tasksAPI.getByProject(project.id);
          allTasks.push(...tasksResponse.data);
        } catch (error) {
          console.error(`Error loading tasks for project ${project.id}:`, error);
        }
      }

      // Sort tasks by creation date (most recent first)
      const sortedTasks = allTasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentTasks(sortedTasks.slice(0, 6)); // Show only 6 most recent tasks

      // Calculate stats
      const completedTasks = allTasks.filter(task => task.status === 'done').length;
      const pendingTasks = allTasks.filter(task => task.status !== 'done').length;

      setStats({
        totalProjects: projectsData.length,
        totalTasks: allTasks.length,
        completedTasks,
        pendingTasks
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleTaskSave = async (taskData) => {
    try {
      if (selectedTask) {
        await tasksAPI.update(selectedTask.id, taskData);
      }
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error saving task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await tasksAPI.delete(taskId);
      setIsTaskModalOpen(false);
      setSelectedTask(null);
      loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of your projects and tasks.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProjects}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Projects</h2>
            <Link
              to="/projects"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          {projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No projects yet</p>
              <Link
                to="/projects"
                className="btn btn-primary inline-flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create your first project
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.slice(0, 5).map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {project.description || 'No description'}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
          </div>
          
          {recentTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tasks yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={handleTaskClick}
                />
              ))}
            </div>
          )}
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
      />
    </div>
  );
};

export default Dashboard;