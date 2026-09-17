import React from "react";
import Footer from "../layout/AppFooter";
import { Main } from "../layout/Main";
import { Meta } from "../layout/Meta";
import Header from "../layout/AppHeader";
import { Layout, List, Avatar, Skeleton } from "antd";
import { fetchAlbums } from "../../lib/queries/user-queries";
import { useQuery } from "react-query";
import { Album } from ".prisma/client";

const { Content } = Layout

}

const Albums: React.FC = () => {
  const { isLoading, data } = useQuery("albums", fetchAlbums);

  return (
    <Main
      meta={(
        <Meta
          title="Fotky"
          description="Albumy fotografií z OH"
        />
      )}
    >
      <Layout className="mainContent">
        <Header active="results" />
        <Content className="content">
          <div><h1 className="text-xl mt-3 mb-2 sectionTitle">Fotky</h1></div>
          <List
            className="albumList"
            grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
            loading={isLoading}
            itemLayout="horizontal"
            dataSource={data}
            locale={{ emptyText: "Zatiaľ tu nie sú žiadne albumy" }}
            renderItem={(item: Album) => (
              <List.Item>
                <a className="albumItem" href={item.link} target="_blank" rel="noopener noreferrer">
                  <Skeleton avatar title={false} loading={isLoading} active>
                    <List.Item.Meta
                      avatar={<Avatar><i className="oma oma-2x oma-black-camera" /></Avatar>}
                      title={<span>{item.name}</span>}
                    />
                  </Skeleton>
                </a>
              </List.Item>
            )}
          />
          <br />
        </Content>
        <Footer />
      </Layout>
    </Main>
  )
};

export default Albums
