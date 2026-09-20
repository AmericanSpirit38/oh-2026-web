import React, { useState } from 'react'
import { Main } from '../../layout/Main'
import { Meta } from '../../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import { useRouter } from 'next/router'
import { Layout, Input, Button, Spin, message, Tag, Table, PageHeader } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from 'react-query'
import Header from '../../layout/AppHeader'
import Footer from '../../layout/AppFooter'

const { Content } = Layout

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  if (!session?.user) {
    return { redirect: { destination: '/api/auth/signin', permanent: false } }
  }
  return { props: {} }
}

const fmt = (d: any) => new Date(d).toLocaleString('sk-SK', {
  day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
})

const fetchDetail = async (id: number) => {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cipher-detail/?id=${id}`)
  if (!r.ok) throw new Error('status ' + r.status)
  return await r.json()
}

const SifraDetail: React.FC = () => {
  const router = useRouter()
  const id = Number(router.query.id)
  const qc = useQueryClient()
  const { isLoading, data } = useQuery(["cipherDetail", id], () => fetchDetail(id), { enabled: !!id })
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)

  const c = data?.cipher

  const submit = async () => {
    if (!answer || answer.trim() === '') {
      message.warning('Zadaj odpoveď')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/cipher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, answer: answer }),
      })
      const result = await res.json()
      if (result.valid) {
        message.success(result.already ? 'Správne (už ste ju mali vyriešenú)' : 'Správne!')
        setAnswer('')
      } else {
        message.error(result.message ? result.message : 'Nesprávna odpoveď')
      }
      qc.invalidateQueries(["cipherDetail", id])
      qc.invalidateQueries("ciphers")
    } catch (e) {
      console.error(e)
      message.error('Odoslanie zlyhalo')
    }
    setBusy(false)
  }

  const columns = [
    { title: 'Čas', dataIndex: 'createdAt', key: 'createdAt', render: (d: any) => fmt(d) },
    { title: 'Odpoveď', dataIndex: 'answer', key: 'answer' },
    { title: 'Kto', key: 'user', render: (_: any, r: any) => r.user?.name || '—' },
    { title: 'Trieda', key: 'class', render: (_: any, r: any) => r.class?.name || '—' },
    {
      title: 'Výsledok', dataIndex: 'correct', key: 'correct',
      render: (v: boolean) => v ? <Tag color="green">správne</Tag> : <Tag color="red">nesprávne</Tag>
    },
  ]

  return (
    <Main meta={(<Meta title={c ? c.name : 'Šifra'} description="Zadanie šifry a odovzdanie odpovede" />)}>
      <Layout className="mainContent">
        <Header />
        <Content className="content">
          {isLoading || !c ? <div className="cipherLoading"><Spin /></div> :
            <>
              <PageHeader
                className="site-page-header"
                onBack={() => router.push('/sifrovacka')}
                title={c.name}
                subTitle={<>Začiatok: {fmt(c.startTime)}</>}
                tags={
                  c.done ? <Tag icon={<CheckCircleOutlined />} color="green">vyriešená</Tag>
                    : (!c.available ? <Tag icon={<LockOutlined />}>ešte nezačala</Tag> : <></>)
                }
              />
              <div className="cipherDetail">
                {c.available && c.hasFile ?
                  <p>
                    <a className="cipherFile" href={`/api/cipher-file?id=${c.id}`} target="_blank" rel="noopener noreferrer">
                      <FileTextOutlined /> {c.fileName ? c.fileName : 'Zadanie'}
                    </a>
                  </p>
                  : null}
                {!c.available ? <p>Zadanie bude dostupné {fmt(c.startTime)}.</p> : null}
                {c.available && !c.hasFile ? <p>K tejto šifre nie je nahraté zadanie.</p> : null}

                {c.available && !c.done ?
                  <div className="cipherForm">
                    <Input
                      placeholder="Odpoveď"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      onPressEnter={submit}
                    />
                    <Button type="primary" onClick={submit} disabled={busy}>
                      {busy ? <Spin size="small" /> : 'Odovzdať'}
                    </Button>
                  </div>
                  : null}

                <h1 className="text-xl mt-3 mb-2 sectionTitle">Odovzdania</h1>
                <Table
                  rowKey="id"
                  size="small"
                  columns={columns}
                  dataSource={data?.submissions}
                  pagination={{ pageSize: 15 }}
                  locale={{ emptyText: "Zatiaľ žiadne odovzdania" }}
                />
              </div>
            </>
          }
          <br />
        </Content>
        <Footer />
      </Layout>
    </Main>
  )
}

export default SifraDetail
