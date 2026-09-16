import React, { useEffect, useState } from 'react'
import Router, { useRouter } from 'next/router'
import { Main } from '../../../layout/Main'
import { Meta } from '../../../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import AdminHeader from '../../../layout/AdminHeader'
import Footer from '../../../layout/AppFooter'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Form, Select, Input, Layout, Button, Spin, message } from 'antd'
import { useQuery } from 'react-query'
import { fetchDisciplines, fetchDiscipline } from '../../../../lib/queries/discipline-queries'
import { Category } from '@prisma/client'

const { Content } = Layout
const { Option } = Select

const SimpleMdeReact = dynamic(() =>
  import('react-simplemde-editor').then((mod) => mod.SimpleMdeReact), {
    ssr: false
  }
)

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

const EditDiscipline: React.FC = () => {
  const router = useRouter()
  const id = Number(router.query.id)
  const [form] = Form.useForm()
  const [sub, setSub] = useState(<span>Uložiť</span>)

  const lists = useQuery("disciplines", fetchDisciplines)
  const disc = useQuery(["discipline", id], () => fetchDiscipline(id), { enabled: !!id })

  useEffect(() => {
    if (disc.data) {
      form.setFieldsValue({
        name: disc.data.name,
        icon: disc.data.icon,
        description: disc.data.description,
        category: disc.data.categoryId != null ? String(disc.data.categoryId) : undefined,
      })
    }
  }, [disc.data])

  const submitData = async (values: any) => {
    setSub(<Spin />)
    try {
      const r = await fetch(`/api/discipline/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!r.ok) throw new Error('status ' + r.status)
      await Router.push('/admin/disciplines')
    } catch (error) {
      console.error(error)
      message.error('Uloženie zlyhalo')
      setSub(<span>Uložiť</span>)
    }
  }

  const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 14 },
  }

  return (
    <Main
      meta={(
        <Meta
          title="Úprava disciplíny"
          description="Stránka na úpravu disciplíny"
        />
      )}
    >
      <AdminHeader />
      <Content className="admin">
        <Link href="/admin/disciplines">&#60;- Naspäť na zoznam disciplín</Link>
        {disc.isLoading ? <Spin /> :
        <Form
          form={form}
          name="edit_discipline"
          {...formItemLayout}
          onFinish={submitData}
        >
          <Form.Item label="Úprava disciplíny">
            <span className="ant-form-text">{disc.data?.name}</span>
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="name"
            label="Názov"
            rules={[{ required: true, message: 'Prosím zadaj názov' }]}
          >
            <Input autoFocus type="text" />
          </Form.Item>
          <Form.Item
            {...formItemLayout}
            name="icon"
            label="Ikona"
            rules={[{ required: false }]}
          >
            <Input type="text" placeholder="napr. oma-black-soccer-ball" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Popis"
            rules={[{ required: false }]}
          >
            <SimpleMdeReact />
          </Form.Item>
          <Form.Item
            name="category"
            label="Kategória"
            rules={[{ required: false }]}
          >
            <Select placeholder="Vyberte kategóriu" allowClear>
              {
                lists.data?.categories?.map((category: Category) => (
                  <Option key={category.id} value={String(category.id)}>{category.name}</Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item wrapperCol={{ span: 12, offset: 6 }}>
            <Button type="primary" htmlType="submit">{sub}</Button>
          </Form.Item>
        </Form>
        }
        <br/>
      </Content>
      <Footer />
    </Main>
  )
}

export default EditDiscipline
