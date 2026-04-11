import { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import client from '../api/client';

const { Title } = Typography;

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get('/services');
      setServices(res.data.data);
    } catch {
      message.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditing(record);
    form.setFieldsValue(record);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await client.put(`/services/${editing.id}`, values);
        message.success('Service updated');
      } else {
        await client.post('/services', values);
        message.success('Service created');
      }
      setModalOpen(false);
      fetchServices();
    } catch {
      // validation errors handled by Ant Design
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/services/${id}`);
      message.success('Service deleted');
      fetchServices();
    } catch {
      message.error('Failed to delete service');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (v) => (v != null ? `$${v}` : '—'),
    },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (v) => v || '—' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(record)} />
          <Popconfirm title="Delete this service?" onConfirm={() => handleDelete(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>Services</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add Service
        </Button>
      </div>
      <Table
        dataSource={services}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
      />
      <Modal
        title={editing ? 'Edit Service' : 'New Service'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Name is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Price" name="price">
            <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Duration" name="duration">
            <Input placeholder="e.g. 30 min" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
