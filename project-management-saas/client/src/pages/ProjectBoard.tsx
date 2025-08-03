import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, closestCorners } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Project, Task } from '../types';
import { projectService, taskService } from '../services/api';
import TaskColumn from '../components/TaskColumn';
import TaskCard from '../components/TaskCard';
import CreateTaskModal from '../components/CreateTaskModal';

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export default function ProjectBoard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<'todo' | 'in_progress' | 'done'>('todo');

  useEffect(() => {
    if (id) {
      loadProjectData(parseInt(id));
    }
  }, [id]);

  const loadProjectData = async (projectId: number) => {
    try {
      const [projectData, tasksData] = await Promise.all([
        projectService.getOne(projectId),
        taskService.getByProject(projectId),
      ]);
      setProject(projectData.project);
      setTasks(tasksData.tasks);
    } catch (error) {
      console.error('Failed to load project data:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = parseInt(active.id as string);
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) return;

    const newStatus = over.id as 'todo' | 'in_progress' | 'done';
    
    // Calculate new position
    const tasksInColumn = tasks.filter(t => t.status === newStatus);
    const newPosition = tasksInColumn.length;

    // Optimistically update UI
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus, position: newPosition } : t
    );
    setTasks(updatedTasks);

    try {
      await taskService.reorder(taskId, newStatus, newPosition);
      // Reload tasks to get accurate positions
      const { tasks: updatedTasks } = await taskService.getByProject(parseInt(id!));
      setTasks(updatedTasks);
    } catch (error) {
      console.error('Failed to reorder task:', error);
      // Revert on error
      setTasks(tasks);
    }

    setActiveTask(null);
  };

  const handleCreateTask = async (title: string, description: string) => {
    if (!project) return;

    try {
      await taskService.create({
        title,
        description,
        project_id: project.id,
        status: createModalStatus,
        position: 0,
      });
      const { tasks: updatedTasks } = await taskService.getByProject(project.id);
      setTasks(updatedTasks);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await taskService.delete(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const openCreateModal = (status: 'todo' | 'in_progress' | 'done') => {
    setCreateModalStatus(status);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-500">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        {project.description && (
          <p className="text-gray-600 mt-1">{project.description}</p>
        )}
      </div>

      <DndContext
        collisionDetection={closestCorners}
        onDragStart={(event) => {
          const task = tasks.find(t => t.id === parseInt(event.active.id as string));
          setActiveTask(task || null);
        }}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter(task => task.status === column.id);
            
            return (
              <TaskColumn
                key={column.id}
                id={column.id}
                title={column.title}
                taskCount={columnTasks.length}
                onAddTask={() => openCreateModal(column.id as any)}
              >
                <SortableContext
                  items={columnTasks.map(t => t.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </SortableContext>
              </TaskColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200 opacity-90">
              <h4 className="font-medium text-gray-900">{activeTask.title}</h4>
              {activeTask.description && (
                <p className="text-sm text-gray-600 mt-1">{activeTask.description}</p>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateTask}
          status={createModalStatus}
        />
      )}
    </div>
  );
}