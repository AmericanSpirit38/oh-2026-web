import React from 'react'
import { Main } from '../layout/Main'
import { Meta } from '../layout/Meta'
import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/client'
import { Layout, List, Avatar, Tag } from 'antd';
import { CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { useQuery } from 'react-query'
import { fetchCiphers } from '../../lib/queries/cipher-queries'
import Header from '../layout/AppHeader';
import Footer from '../layout/AppFooter';
import Link from 'next/link';

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
  const { isLoading, data } = useQuery("ciphers", fetchCiphers)

  return (
    <Main meta={(<Meta title="Šifrovačka" description="Zadania šifier a odovzdávanie odpovedí" />)}>
      <Layout className="mainContent">
        <Header />
        <Content className="content">
          <div><h1 className="text-xl mt-3 mb-2 sectionTitle">Šifrovačka</h1></div>
          <List
            className="postList"
            loading={isLoading}
            itemLayout="horizontal"
            dataSource={data?.ciphers}
            locale={{ emptyText: "Zatiaľ tu nie sú žiadne šifry" }}
            renderItem={(c: any) => (
              <List.Item
                key={c.id}
                actions={[
                  c.done ? <Tag icon={<CheckCircleOutlined />} color="green">vyriešená</Tag> : <></>,
                  !c.available ? <Tag icon={<LockOutlined />}>ešte nezačala</Tag> : <></>,
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar><i className="oma oma-2x oma-black-locked-with-key" /></Avatar>}
                  title={<Link href={`/sifra/${c.id}`}><a>{c.name}</a></Link>}
                  description={fmt(c.startTime)}
                />
              </List.Item>
            )}
          />
          <br />
        </Content>
        <Footer />
      </Layout>
    </Main>
  )
}

export default Sifrovacka
