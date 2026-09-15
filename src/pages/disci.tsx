import { GetServerSideProps, InferGetServerSidePropsType } from "next";
import {useSession} from "next-auth/client";
import React from "react";
import {dehydrate} from "react-query/hydration";
import queryClient from "../../lib/clients/react-query";
import {fetchDisciplines} from "../../lib/queries/discipline-queries";
import DisciplineList from "../components/DisciplineList";
import Footer from "../layout/AppFooter";
import Header from "../layout/AppHeader";
import { Main } from "../layout/Main";
import { Meta } from "../layout/Meta";
import { Layout } from "antd";
import { useQuery } from "react-query";
import { fetchResults} from "../../lib/queries/event-queries";
import {EventResult} from ".prisma/client";


const { Sider, Content  } = Layout

export const getServerSideProps: GetServerSideProps = async () => {
  await queryClient.prefetchQuery("disciplines", fetchDisciplines)
  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  };
};

const Disciplines: React.FC = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const [session, loading] = useSession()




  return (
    <Main
      meta={(
        <Meta
          title="Disciplíny"
          description="List všetkých disciplín"
        />
      )}
    >
      <Layout className="mainContent">
        <Header />
        <Layout className="limit">
          <Content className="content">
          <DisciplineList/>
        </Content>
        </Layout>
        <Footer />
      </Layout>
    </Main>
  )
};

export default Disciplines
