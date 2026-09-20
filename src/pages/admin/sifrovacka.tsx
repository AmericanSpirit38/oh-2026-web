import React, { useState } from 'react'
import { Main } from '../../layout/Main'
import { Meta } from '../../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import AdminHeader from '../../layout/AdminHeader'
import Footer from '../../layout/AppFooter'
import Link from 'next/link'
import { Layout, Table, Tag, Button, Modal, Form, Input, DatePicker, message, Popconfirm, Space } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from 'react-query'
import moment from 'moment'

const { Content } = Layout

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  if (!session?.user) {
    return { redirect: { destination: '/api/auth/signin', permanent: false } }
  }
  if (session?.user.role != 'ADMIN' && session?.user.role != 'EDITOR') {
    return { redirect: { destination: '/404', permanent: false } }
  }
  return { props: {} }
}

const fetchAdminCiphers = async () => {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cipher-admin/`)
  return await r.json()
}

const fmt = (d: any) => new Date(d).toLocaleString('sk-SK', {
  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const AdminSifrovacka: React.FC = () => {
  const qc = useQueryClient()
  const { isLoading, data } = useQuery("adminCiphers", fetchAdminCiphers)
  const [editing, setEditing] = useState<any>(null)
  const [fileData, setFileData] = useState<any>(null)
  const [form] = Form.useForm()

  const onFile = (e: any) => {
    const f = e.target.files && e.target.files[0]
    if (!f) { setFileData(null); return }
    const r = new FileReader()
    r.onload = () => {
      const s = String(r.result)
      setFileData({ name: f.name, type: f.type || 'application/octet-stream', data: s.substring(s.indexOf(',') + 1) })
    }
    r.readAsDataURL(f)
  }

  const openEdit = (rec: any) => {
    setFileData(null)
    setEditing(rec)
    form.setFieldsValue({
      name: rec.name,
      answer: rec.answer,
      start: moment(rec.startTime),
    })
  }

  const save = async (values: any) => {
    try {
      const body: any = {
        id: editing.id,
        name: values.name,
        answer: values.answer,
        start: values.start,
      }
      if (fileData) {
        body.file = fileData.data
        body.fileName = fileData.name
        body.mimeType = fileData.type
      }
      const r = await fetch('/api/cipher', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error('status ' + r.status)
      message.success('Uložené')
      setEditing(null)
      qc.invalidateQueries("adminCiphers")
    } catch (e) {
      console.error(e)
      message.error('Uloženie zlyhalo')
    }
  }

  const remove = async (id: number) => {
    try {
      const r = await fetch('/api/cipher', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id }),
      })
      if (!r.ok) throw new Error('status ' + r.status)
      message.success('Zmazané')
      qc.invalidateQueries("adminCiphers")
    } catch (e) {
      console.error(e)
      message.error('Mazanie zlyhalo')
    }
  }

  const columns = [
    { title: 'Názov', dataIndex: 'name', key: 'name' },
    { title: 'Riešenie', dataIndex: 'answer', key: 'answer' },
    { title: 'Začiatok', dataIndex: 'startTime', key: 'startTime', render: (d: any) => fmt(d) },
    {
      title: 'Zadanie', key: 'file',
      render: (_: any, r: any) => r.hasFile
        ? <a href={`/api/cipher-file?id=${r.id}`} target="_blank" rel="noopener noreferrer"><FileTextOutlined /> {r.fileName}</a>
        : <Tag>chýba</Tag>
    },
    { title: 'Pokusov', dataIndex: 'pokusy', key: 'pokusy', width: 90 },
    { title: 'Vyriešili', key: 'vyriesili', width: 100, render: (_: any, r: any) => `${r.vyriesiloTried} tried` },
    {
      title: 'Akcia', key: 'akcia', width: 160,
      render: (_: any, r: any) => (
        <Space>
          <a onClick={() => openEdit(r)}>Upraviť</a>
          <Popconfirm
            title="Zmazať šifru aj všetky jej odovzdania?"
            okText="Zmazať"
            cancelText="Zrušiť"
            onConfirm={() => remove(r.id)}
          >
            <a>Zmazať</a>
          </Popconfirm>
        </Space>
      )
    },
  ]

  return (
    <Main meta={(<Meta title="Správa šifier" description="Správa šifier" />)}>
      <AdminHeader />
      <Content className="admin">
        <Link href="/admin"><a>&#60;- Naspäť na dashboard</a></Link>
        <h1 className="text-xl mt-3 mb-2 sectionTitle">Šifry</h1>
        <p>
          <Link href="/admin/create/sifra"><a>+ Nová šifra</a></Link>
          {'  ·  '}
          <Link href="/admin/sifry"><a>Prehľad odovzdaní</a></Link>
        </p>
        <Table
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={data}
          pagination={false}
          locale={{ emptyText: "Zatiaľ žiadne šifry" }}
        />
        <Modal
          title="Úprava šifry"
          visible={!!editing}
          onCancel={() => setEditing(null)}
          onOk={() => form.submit()}
          okText="Uložiť"
          cancelText="Zrušiť"
        >
          <Form form={form} layout="vertical" onFinish={save}>
            <Form.Item name="name" label="Názov" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="answer" label="Riešenie" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="start" label="Začiatok" rules={[{ required: true }]}>
              <DatePicker showTime />
            </Form.Item>
            <Form.Item label="Nové zadanie (nepovinné)">
              <input type="file" onChange={onFile} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.zip,.docx" />
              {fileData ? <div className="ant-form-text">{fileData.name}</div> : null}
            </Form.Item>
          </Form>
        </Modal>
        <br />
      </Content>
      <Footer />
    </Main>
  )
}

export default AdminSifrovacka
