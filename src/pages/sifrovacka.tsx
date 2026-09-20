import React, { useState } from 'react'
import { Main } from '../layout/Main'
import { Meta } from '../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import { Input, Button, Spin, message, Layout, List, Tag, Table } from 'antd';
import { FileTextOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from 'react-query'
import { fetchCiphers, fetchCipherSubmissions } from '../../lib/queries/cipher-queries'
import Header from '../layout/AppHeader';
import Footer from '../layout/AppFooter';

const { Content } = Layout;

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

const Sifrovacka: React.FC = () => {
  const qc = useQueryClient()
  const ciphers = useQuery("ciphers", fetchCiphers)
  const history = useQuery("cipherSubmissions", fetchCipherSubmissions)
  const [answers, setAnswers] = useState<any>({})
  const [busy, setBusy] = useState<number | null>(null)

  const submit = async (id: number) => {
    const answer = answers[id]
    if (!answer || String(answer).trim() === '') {
      message.warning('Zadaj odpoveď')
      return
    }
    setBusy(id)
    try {
      const res = await fetch('/api/cipher', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, answer: answer }),
      })
      const result = await res.json()
      if (result.valid) {
        message.success(result.already ? 'Správne (už ste ju mali vyriešenú)' : 'Správne!')
        setAnswers({ ...answers, [id]: '' })
      } else {
        message.error(result.message ? result.message : 'Nesprávna odpoveď')
      }
      qc.invalidateQueries("ciphers")
      qc.invalidateQueries("cipherSubmissions")
    } catch (error) {
      console.error(error)
      message.error('Odoslanie zlyhalo')
    }
    setBusy(null)
  }

  const columns = [
    { title: 'Čas', dataIndex: 'createdAt', key: 'createdAt', render: (d: any) => fmt(d) },
    { title: 'Šifra', key: 'sifra', render: (_: any, r: any) => r.sifra?.name },
    { title: 'Odpoveď', dataIndex: 'answer', key: 'answer' },
    { title: 'Kto', key: 'user', render: (_: any, r: any) => r.user?.name },
    {
      title: 'Výsledok', dataIndex: 'correct', key: 'correct',
      render: (c: boolean) => c ? <Tag color="green">správne</Tag> : <Tag color="red">nesprávne</Tag>
    },
  ]

  return (
    <Main meta={(<Meta title="Šifrovačka" description="Zadania šifier a odovzdávanie odpovedí" />)}>
      <Layout className="mainContent">
        <Header />
        <Content className="content">
          <div><h1 className="text-xl mt-3 mb-2 sectionTitle">Šifrovačka</h1></div>
          <List
            className="cipherList"
            loading={ciphers.isLoading}
            itemLayout="vertical"
            dataSource={ciphers.data?.ciphers}
            locale={{ emptyText: "Zatiaľ tu nie sú žiadne šifry" }}
            renderItem={(c: any) => (
              <List.Item key={c.id}>
                <div className="cipherCard">
                  <div className="cipherHead">
                    <span className="cipherName">{c.name}</span>
                    {c.done ? <Tag icon={<CheckCircleOutlined />} color="green">vyriešená</Tag> : null}
                    {!c.available ? <Tag icon={<LockOutlined />}>od {fmt(c.startTime)}</Tag> : null}
                  </div>
                  {c.available && c.hasFile ?
                    <a className="cipherFile" href={`/api/cipher-file?id=${c.id}`} target="_blank" rel="noopener noreferrer">
                      <FileTextOutlined /> {c.fileName ? c.fileName : 'Zadanie'}
                    </a>
                    : null}
                  {c.available && !c.done ?
                    <div className="cipherForm">
                      <Input
                        placeholder="Odpoveď"
                        value={answers[c.id] || ''}
                        onChange={(e) => setAnswers({ ...answers, [c.id]: e.target.value })}
                        onPressEnter={() => submit(c.id)}
                      />
                      <Button type="primary" onClick={() => submit(c.id)} disabled={busy === c.id}>
                        {busy === c.id ? <Spin size="small" /> : 'Odovzdať'}
                      </Button>
                    </div>
                    : null}
                </div>
              </List.Item>
            )}
          />

          <div><h1 className="text-xl mt-3 mb-2 sectionTitle">História odovzdaní</h1></div>
          <Table
            className="cipherHistory"
            rowKey="id"
            size="small"
            loading={history.isLoading}
            columns={columns}
            dataSource={history.data}
            pagination={{ pageSize: 15 }}
            locale={{ emptyText: "Zatiaľ žiadne odovzdania" }}
          />
          <br />
        </Content>
        <Footer />
      </Layout>
    </Main>
  )
}

export default Sifrovacka
