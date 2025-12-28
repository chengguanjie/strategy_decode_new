'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Input, Button, Avatar, Tree, Modal, Form, Select, message, Spin, Dropdown, type MenuProps } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  UserOutlined,
  DownOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import './OrganizationSettings.scss';

interface Department {
  id: string;
  name: string;
  leader?: string; // Not in DB yet
  memberCount: number;
  parentId?: string | null;
  children?: Department[];
}

interface Member {
  id: string;
  name: string;
  email?: string;
  position?: string; // Not in DB yet
  role?: string;
  departmentId?: string;
  avatar?: string;
}

export default function OrganizationSettings() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [members, setMembers] = useState<Member[]>([]);

  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [searchValue, setSearchValue] = useState('');
  const [addMemberVisible, setAddMemberVisible] = useState(false);
  const [addDeptVisible, setAddDeptVisible] = useState(false);
  const [editDeptVisible, setEditDeptVisible] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  const [form] = Form.useForm();
  const [deptForm] = Form.useForm();
  const [editDeptForm] = Form.useForm();

  // Handle 401 error and redirect to login
  const handle401Error = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.error('登录已过期，请重新登录');
    window.location.href = '/enterprise/login';
  }, []);

  // Fetch Departments
  const fetchDepartments = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handle401Error();
        return;
      }
      const res = await fetch('/api/enterprise/departments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handle401Error();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // API 返回格式: { success: true, data: [...] }
        const deptList = data.data || data;
        setDepartments(Array.isArray(deptList) ? deptList : []);
        // Default select first department if none selected
        if (!selectedDeptId && Array.isArray(deptList) && deptList.length > 0) {
          // Find a root or just the first one
          setSelectedDeptId(deptList[0].id);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.error?.message || '获取部门列表失败');
      }
    } catch (e) {
      console.error(e);
      message.error('网络错误，请检查网络连接');
    } finally {
      setLoadingDepts(false);
    }
  }, [selectedDeptId, handle401Error]);

  // Fetch Members when selectedDeptId changes
  const fetchMembers = useCallback(async () => {
    if (!selectedDeptId) return;
    setLoadingMembers(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        handle401Error();
        return;
      }
      const res = await fetch(`/api/enterprise/users?departmentId=${selectedDeptId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handle401Error();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        // API 返回格式: { success: true, data: [...] }
        const memberList = data.data || data;
        setMembers(Array.isArray(memberList) ? memberList : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        message.error(errData.error?.message || '获取成员列表失败');
      }
    } catch (e) {
      console.error(e);
      message.error('网络错误，请检查网络连接');
    } finally {
      setLoadingMembers(false);
    }
  }, [selectedDeptId, handle401Error]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleAddMember = async () => {
    try {
      const values = await form.validateFields();
      if (!selectedDeptId) {
        message.error('请先选择一个部门');
        return;
      }

      const token = localStorage.getItem('token');
      // Note: We need email for unique user creation. Using a placeholder if not provided in UI form?
      // The current UI form has Name, Position, Role. It lacks Email/Password which are required by DB User model.
      // We should probably prompt for Email/Password or auto-generate.
      // For this specific 'Add Member' quick action, usually it implies adding an EXISTING user to dept or creating a placeholder.
      // But given strict DB requirement (email unique), let's assume valid data input is needed.
      // I will update the form in the modal to include Email and Password (optional or default).
      // Or I can generate a fake email like `user_${timestamp}@enterprise.com` to satisfy DB constraint if the user just wants to see visual cards.
      // Better: Add Email field to the form.

      // Construct payload
      const payload = {
        name: values.name,
        // Using a generated email if not provided to simplify quick adding for demo, 
        // BUT user asked for "real database data". So I should probably require real input or generate safe unique one.
        email: values.email || `user_${Date.now()}@example.com`,
        password: 'password123', // Default password
        role: values.role === '管理' ? 'MANAGER' : 'EMPLOYEE',
        departmentId: selectedDeptId,
        // position is not stored in DB currently so it will start empty on refresh unless we add it to DB.
      };

      const res = await fetch('/api/enterprise/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        message.success(`成功添加成员: ${values.name}`);
        setAddMemberVisible(false);
        form.resetFields();
        fetchMembers(); // Refresh list
        fetchDepartments(); // Refresh count
      } else {
        const err = await res.json();
        message.error(err.error || '添加失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddDept = async () => {
    try {
      const values = await deptForm.validateFields();
      const token = localStorage.getItem('token');
      const payload = {
        name: values.name,
        leader: values.leader, // API currently ignores this but passing for consistency if we update API later
        parentId: values.parentId || null
      };

      const res = await fetch('/api/enterprise/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        message.success(`成功添加部门: ${values.name}`);
        setAddDeptVisible(false);
        deptForm.resetFields();
        fetchDepartments();
      } else {
        const err = await res.json();
        message.error(err.error || '添加失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditDept = async () => {
    try {
      const values = await editDeptForm.validateFields();
      if (!editingDept) return;

      const token = localStorage.getItem('token');
      const payload = {
        name: values.name,
        leader: values.leader || null,
        parentId: values.parentId || null
      };

      const res = await fetch(`/api/enterprise/departments/${editingDept.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        message.success(`成功修改部门: ${values.name}`);
        setEditDeptVisible(false);
        setEditingDept(null);
        editDeptForm.resetFields();
        fetchDepartments();
      } else {
        const err = await res.json();
        message.error(err.error || '修改失败');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDept = (dept: Department) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除部门 "${dept.name}" 吗？如果该部门下有成员或子部门,将无法删除。`,
      okType: 'danger',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/enterprise/departments/${dept.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (res.ok) {
            message.success('删除成功');
            fetchDepartments();
            // If deleted dept was selected, clear selection
            if (selectedDeptId === dept.id) {
              setSelectedDeptId('');
            }
          } else {
            const err = await res.json();
            message.error(err.error || '删除失败');
          }
        } catch (e) {
          message.error('网络错误');
        }
      }
    });
  };

  const handleDeptContextMenu = (dept: Department) => {
    setEditingDept(dept);
    editDeptForm.setFieldsValue({
      name: dept.name,
      leader: dept.leader || '',
      parentId: dept.parentId || ''
    });
    setEditDeptVisible(true);
  };

  // Convert flat departments list to Tree Data
  const getTreeData = (): DataNode[] => {
    if (!departments.length) return [];

    const buildNode = (parentId: string | null): DataNode[] => {
      return departments
        .filter(d => (d.parentId === parentId) || (!parentId && !d.parentId))
        .map(dept => {
          const children = buildNode(dept.id);

          const menuItems: MenuProps['items'] = [
            {
              key: 'edit',
              label: '编辑',
              icon: <EditOutlined />,
              onClick: () => handleDeptContextMenu(dept)
            },
            {
              key: 'delete',
              label: '删除',
              icon: <DeleteOutlined />,
              danger: true,
              onClick: () => handleDeleteDept(dept)
            }
          ];

          return {
            key: dept.id,
            title: (
              <Dropdown menu={{ items: menuItems }} trigger={['contextMenu']}>
                <div className="dept-tree-item" style={{ cursor: 'context-menu' }}>
                  <span className="dept-name">{dept.name}</span>
                  <span className="dept-leader">{dept.leader || ''}</span>
                  <span className="dept-count">{dept.memberCount || 0}人</span>
                </div>
              </Dropdown>
            ),
            children: children.length ? children : undefined
          }
        });
    };

    return buildNode(null);
  };

  const filteredMembers = searchValue
    ? members.filter(m => m.name.includes(searchValue))
    : members;

  const currentDept = departments.find(d => d.id === selectedDeptId);

  return (
    <div className="organization-settings">
      <div className="org-left-panel">
        <div className="panel-header">
          <span className="panel-title">组织架构</span>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setAddDeptVisible(true)}
          />
        </div>
        <div className="dept-tree">
          {loadingDepts ? <div style={{ textAlign: 'center', padding: 20 }}><Spin /></div> : (
            <Tree
              showLine={{ showLeafIcon: false }}
              switcherIcon={<DownOutlined />}
              defaultExpandAll
              selectedKeys={[selectedDeptId]}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedDeptId(keys[0] as string);
                }
              }}
              treeData={getTreeData()}
            />
          )}
        </div>
      </div>

      <div className="org-right-panel">
        <div className="panel-header">
          <div className="dept-info">
            <h2 className="dept-title">
              {currentDept?.name}
              <span className="member-count">{currentDept?.memberCount || 0} 成员</span>
            </h2>
            <div className="dept-leader-info">负责人：{currentDept?.leader || '-'}</div>
          </div>
          <div className="header-actions">
            <Input
              placeholder="搜索成员"
              prefix={<SearchOutlined />}
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              className="search-input"
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddMemberVisible(true)}
            >
              添加成员
            </Button>
            <Button icon={<SettingOutlined />}>设置</Button>
          </div>
        </div>

        <div className="members-grid">
          {loadingMembers ? <div style={{ width: '100%', textAlign: 'center', padding: 40 }}><Spin /></div> : (
            <>
              {filteredMembers.map(member => (
                <div key={member.id} className="member-card">
                  <Avatar size={48} icon={<UserOutlined />} className="member-avatar" />
                  <div className="member-info">
                    <div className="member-name">{member.name}</div>
                    <div className="member-position">
                      {member.position || '员工'}
                    </div>
                    <div className="member-role">{member.role === 'ENTERPRISE_ADMIN' ? '管理员' : (member.role === 'MANAGER' ? '负责人' : '成员')}</div>
                  </div>
                </div>
              ))}
              <div
                className="member-card add-card"
                onClick={() => setAddMemberVisible(true)}
              >
                <PlusOutlined className="add-icon" />
                <span className="add-text">添加成员</span>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        title="添加成员"
        open={addMemberVisible}
        onOk={handleAddMember}
        onCancel={() => {
          setAddMemberVisible(false);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入成员姓名" />
          </Form.Item>
          {/* Added Email field for DB requirement */}
          <Form.Item
            name="email"
            label="登录账号 (邮箱或手机号)"
            rules={[
              { required: true, message: '请输入登录账号' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  const phoneRegex = /^1[3-9]\d{9}$/;
                  if (emailRegex.test(value) || phoneRegex.test(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('请输入有效的邮箱或手机号'));
                },
              },
            ]}
          >
            <Input placeholder="user@example.com 或 13800000000" />
          </Form.Item>
          <Form.Item
            name="position"
            label="职位"
          >
            <Input placeholder="请输入职位 (暂不保存)" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="成员">
            <Select placeholder="请选择角色">
              <Select.Option value="管理">管理</Select.Option>
              <Select.Option value="成员">成员</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加部门"
        open={addDeptVisible}
        onOk={handleAddDept}
        onCancel={() => {
          setAddDeptVisible(false);
          deptForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={deptForm} layout="vertical">
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          {/* Leader field exists in form but won't persist to DB as per current schema */}
          <Form.Item
            name="leader"
            label="负责人"
          >
            <Input placeholder="请输入负责人姓名 (暂不保存)" />
          </Form.Item>
          <Form.Item name="parentId" label="上级部门">
            <Select placeholder="请选择上级部门" allowClear>
              <Select.Option value="">无</Select.Option>
              {departments.map(dept => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑部门"
        open={editDeptVisible}
        onOk={handleEditDept}
        onCancel={() => {
          setEditDeptVisible(false);
          setEditingDept(null);
          editDeptForm.resetFields();
        }}
        okText="确认"
        cancelText="取消"
      >
        <Form form={editDeptForm} layout="vertical">
          <Form.Item
            name="name"
            label="部门名称"
            rules={[{ required: true, message: '请输入部门名称' }]}
          >
            <Input placeholder="请输入部门名称" />
          </Form.Item>
          <Form.Item
            name="leader"
            label="负责人"
          >
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>
          <Form.Item name="parentId" label="上级部门">
            <Select placeholder="请选择上级部门" allowClear>
              <Select.Option value="">无</Select.Option>
              {departments
                .filter(d => d.id !== editingDept?.id) // Can't set self as parent
                .map(dept => (
                  <Select.Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
