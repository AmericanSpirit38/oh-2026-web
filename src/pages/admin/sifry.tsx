import React from 'react'
import { Main } from '../../layout/Main'
import { Meta } from '../../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import AdminHeader from '../../layout/AdminHeader'
import Footer from '../../layout/AppFooter'
import Link from 'next/link'
import { Layout, Table, Tag, Statistic, Row, Col } from 'antd'
import { useQuery } from 'react-query'
import { fetchCipherSubmissions } from '../../../lib/queries/cipher-queries'

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

const fmt = (d: any) => new Date(d).toLocaleString('sk-SK', {
  day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
})

const AdminSifry: React.FC = () => {
  const { isLoading, data } = useQuery("cipherSubmissions", fetchCipherSubmissions)

  const rows = data || []
  const spolu = rows.length
  const spravne = rows.filter((r: any) => r.correct).length

  const columns = [
    { title: 'Čas', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (d: any) => fmt(d) },
    { title: 'Trieda', key: 'class', width: 110, render: (_: any, r: any) => r.class?.name || '—' },
    { title: 'Šifra', key: 'sifra', render: (_: any, r: any) => r.sifra?.name },
    { title: 'Odpoveď', dataIndex: 'answer', key: 'answer' },
    { title: 'Kto', key: 'user', render: (_: any, r: any) => r.user?.name || '—' },
    {
      title: 'Výsledok', dataIndex: 'correct', key: 'correct', width: 120,
      filters: [{ text: 'správne', value: true }, { text: 'nesprávne', value: false }],
      onFilter: (v: any, r: any) => r.correct === v,
      render: (c: boolean) => c ? <Tag color="green">správne</Tag> : <Tag color="red">nesprávne</Tag>
    },
  ]

  return (
    <Main meta={(<Meta title="Šifrovačka — prehľad" description="Prehľad odovzdaní" />)}>
      <AdminHeader />
      <Content className="admin">
        <Link href="/admin"><a>&#60;- Naspäť na admin</a></Link>
        <h1 className="text-xl mt-3 mb-2 sectionTitle">Odovzdania šifier</h1>
        <Row gutter={16} className="cipherStats">
          <Col><Statistic title="Spolu pokusov" value={spolu} /></Col>
          <Col><Statistic title="Správnych" value={spravne} /></Col>
          <Col><Statistic title="Nesprávnych" value={spolu - spravne} /></Col>
        </Row>
        <Table
          rowKey="id"
          size="small"
          loading={isLoading}
          columns={columns}
          dataSource={rows}
          pagination={{ pageSize: 25 }}
          locale={{ emptyText: "Zatiaľ žiadne odovzdania" }}
        />
        <br />
      </Content>
      <Footer />
    </Main>
  )
}

export default AdminSifry
