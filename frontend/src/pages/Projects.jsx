import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsAPI } from '../utils/api';
import { Plus, FolderOpen, Calendar, User, Search } from 'lucide-react';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      await projectsAPI.create(newProject);
      setNewProject({ name: '', description: '' });
      setShowCreateForm(false);
      loadProjects();
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage your projects and collaborate with your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Create Project Form */}
      {showCreateForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Project</h2>
          <form onSubmit={handleCreateProject} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="input"
                required
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="input"
                rows={3}
                placeholder="Enter project description"
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Create Project
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProject({ name: '', description: '' });
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No projects found' : 'No projects yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first project to get started'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {project.name}
              </h3>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {project.description || 'No description provided'}
              </p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <User className="w-3 h-3 mr-1" />
                  {project.owner_name}
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(project.created_at).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;