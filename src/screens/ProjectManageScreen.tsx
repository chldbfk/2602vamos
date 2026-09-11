import { useState } from 'react'
import { ArrowLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/AppStore'
import ProjectFormSheet from '../components/ProjectFormSheet'
import DeleteProjectSheet from '../components/DeleteProjectSheet'
import type { Project } from '../types'

/** Full-screen "프로젝트 관리" page — reached from the 관리 tab's "+ 프로젝트" button. All
 *  project-level create/edit/delete lives here now; the main 관리 list only reads from it. */
export default function ProjectManageScreen({ onBack }: { onBack: () => void }) {
  const { projects, tasks, templates, addProject, updateProject, deleteProject, archiveProject } =
    useAppStore()
  const activeProjects = projects.filter((p) => !p.archived)

  const [editingProject, setEditingProject] = useState<Project | 'new' | null>(null)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '18px 20px 8px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            color: 'var(--text-muted)',
          }}
          aria-label="뒤로"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, flex: 1 }}>프로젝트 관리</h1>
        <button
          onClick={() => setEditingProject('new')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> 새 프로젝트
        </button>
      </div>

      <div
        className="no-scrollbar"
        style={{ flex: 1, overflowY: 'auto', padding: '10px 20px 40px', minHeight: 0 }}
      >
        {activeProjects.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              fontSize: 13,
              padding: '52px 12px',
              border: '1.5px dashed var(--border)',
              borderRadius: 18,
              lineHeight: 1.7,
            }}
          >
            아직 만든 프로젝트가 없어요.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeProjects.map((p) => {
            const subCount = templates.filter((t) => t.projectId === p.id).length
            return (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  background: 'var(--surface)',
                  padding: '12px 14px',
                }}
              >
                <span
                  style={{ width: 10, height: 10, borderRadius: 999, background: p.color, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {p.name}
                    {p.isSystem && (
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 700,
                          color: 'var(--text-faint)',
                          background: 'var(--bg)',
                          borderRadius: 999,
                          padding: '1px 7px',
                        }}
                      >
                        기본
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>
                    할 일 {subCount}개
                  </div>
                </div>
                <button
                  onClick={() => setEditingProject(p)}
                  style={{
                    background: 'var(--bg)',
                    border: 'none',
                    borderRadius: 999,
                    width: 30,
                    height: 30,
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                  aria-label={`${p.name} 수정`}
                >
                  <Pencil size={14} />
                </button>
                {!p.isSystem && (
                  <button
                    onClick={() => setDeletingProject(p)}
                    style={{
                      background: '#fff1f0',
                      border: 'none',
                      borderRadius: 999,
                      width: 30,
                      height: 30,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      color: 'var(--danger)',
                      flexShrink: 0,
                    }}
                    aria-label={`${p.name} 삭제`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {editingProject && (
        <ProjectFormSheet
          initial={editingProject === 'new' ? undefined : editingProject}
          onClose={() => setEditingProject(null)}
          onSubmit={(name, color) => {
            if (editingProject === 'new') {
              addProject(name, color)
            } else {
              updateProject(editingProject.id, { name, color })
            }
          }}
        />
      )}

      {deletingProject && (
        <DeleteProjectSheet
          projectName={deletingProject.name}
          activeCount={
            templates.filter((t) => t.projectId === deletingProject.id).length +
            tasks.filter((t) => t.projectId === deletingProject.id && !t.done).length
          }
          completedCount={tasks.filter((t) => t.projectId === deletingProject.id && t.done).length}
          onClose={() => setDeletingProject(null)}
          onKeepCompleted={() => archiveProject(deletingProject.id)}
          onDeleteAll={() => deleteProject(deletingProject.id)}
        />
      )}
    </div>
  )
}
