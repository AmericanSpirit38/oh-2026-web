import React from "react";
import moment from "moment";
import {Meta} from "../layout/Meta";
import Header from "../layout/AppHeader";
import Footer from "../layout/AppFooter";
import {Main} from "../layout/Main";
import {GetServerSideProps, InferGetServerSidePropsType } from "next";
import queryClient from "../../lib/clients/react-query";
import {dehydrate} from "react-query/hydration";
import { Layout, Calendar, Badge } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import {Event} from ".prisma/client";
import {useQuery} from 'react-query';
import {fetchEvents} from "../../lib/queries/event-queries";
import {parseISO} from "date-fns";

const { Content } = Layout

const CAL_YEAR = 2026;

export const getServerSideProps: GetServerSideProps = async () => {
  await queryClient.prefetchQuery("events", fetchEvents);
  return {
    props: {
      dehydratedState: dehydrate(queryClient),
    },
  }
};

const BigCalendar: React.FC = (props: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { isLoading, isError, data, error } = useQuery("events", fetchEvents);

  function dateCellRender(value: moment.Moment) {
    let d = value.toDate();
    d.setHours(0,0,1,1);
    return (
      <ul className="bigEvents">
        {data?.map((event: Event) =>{
          let s = parseISO(event.startDate.toString())
          let e = parseISO(event.endDate.toString())
          s.setHours(0,0,1,1);
          e.setHours(0,0,1,1);
          if (s <= d && d <= e) {
          return (
            <li key={event.id}>
               <Badge color={event.color!} status="default" text={event.name} />
            </li>
          )
        }})}
      </ul>
    );
  }

  function headerRender({ value, onChange }: any) {
    const step = (delta: number) => {
      const next = value.clone().add(delta, 'month');
      if (next.year() !== CAL_YEAR) return;
      onChange(next);
    };

    const jumpToToday = () => {
      const now = moment();
      onChange(now.year() === CAL_YEAR ? now : value.clone().month(0).date(1));
    };

    const title = value.format('MMMM');
    const isCurrentMonth = moment().year() === CAL_YEAR && moment().month() === value.month();

    return (
      <div className="calHeader">
        <button type="button" className="calNav" aria-label="Predchadzajuci mesiac" disabled={value.month() === 0} onClick={() => step(-1)}>&#8249;</button>
        <div className="calTitle">{title.charAt(0).toUpperCase() + title.slice(1)} {CAL_YEAR}</div>
        <button type="button" className="calNav" aria-label="Nasledujuci mesiac" disabled={value.month() === 11} onClick={() => step(1)}>&#8250;</button>
        <button type="button" className="calToday" disabled={isCurrentMonth} onClick={jumpToToday} title="Dnes" aria-label="Prejst na dnesny mesiac"><CalendarOutlined /></button>
      </div>
    );
  }

  const initial = moment().year() === CAL_YEAR ? moment() : moment(CAL_YEAR + "-01-01");

  return (
    <Main meta={(
      <Meta
        title="Kalendár"
        description="Kalendár udalostí"
      />
    )}>
      <Layout>
        <Header />
          <Content>
          <Calendar mode="month" defaultValue={initial} validRange={[moment(CAL_YEAR + "-01-01"), moment(CAL_YEAR + "-12-31")]} headerRender={headerRender} dateCellRender={dateCellRender} />
          </Content>
        <Footer />
      </Layout>
    </Main>
  )
}

export default BigCalendar;
