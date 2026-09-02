import Link from 'next/link';
import moment from 'moment';
import { Calendar, Badge, Spin } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import {default as Ev} from '../Event';
import React, { ReactNode, useState } from 'react'
import {useQuery} from 'react-query';
import {fetchEvents} from '../../../lib/queries/event-queries';
import { Event} from '.prisma/client';
import { parseISO } from 'date-fns';

type ICalendarProps = {
  children?: ReactNode;
};

const CAL_YEAR = 2026;

const CalendarWidget: React.FC<ICalendarProps> = () => {
  const { isLoading, isError, data, error } = useQuery("events", fetchEvents);
  const [list, setList] = useState([])

  const changeHandler = (date: moment.Moment) => {
    let d = date.toDate();
    d.setHours(0,0,1,1);
    setList(data.filter((event: Event) => { 
      let s = parseISO(event.startDate.toString())
      let e = parseISO(event.endDate.toString())
      s.setHours(0,0,1,1);
      e.setHours(0,0,1,1);
      return s <= d && d <= e
    }))
  }

  function dateCellRender(value: moment.Moment) {
    let d = value.toDate();
    d.setHours(0,0,1,1);
    return (
      <ul className="events">
        {data?.map((event: Event) =>{
          let s = parseISO(event.startDate.toString())
          let e = parseISO(event.endDate.toString())
          s.setHours(0,0,1,1);
          e.setHours(0,0,1,1);
          if (s <= d && d <= e) {
          return (
            <li key={event.id}>
              <Badge className="calEvent" color={event.color!} status="default" />
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
      <div className="calHeader calHeaderMini">
        <button type="button" className="calNav" aria-label="Predchadzajuci mesiac" disabled={value.month() === 0} onClick={() => step(-1)}>&#8249;</button>
        <div className="calTitle">{title.charAt(0).toUpperCase() + title.slice(1)}</div>
        <button type="button" className="calNav" aria-label="Nasledujuci mesiac" disabled={value.month() === 11} onClick={() => step(1)}>&#8250;</button>
        <button type="button" className="calToday" disabled={isCurrentMonth} onClick={jumpToToday} title="Dnes" aria-label="Prejst na dnesny mesiac"><CalendarOutlined /></button>
      </div>
    );
  }

  const initial = moment().year() === CAL_YEAR ? moment() : moment(CAL_YEAR + "-01-01");

  return (
    <div>
      <Link href="/calendar"><h1 className="text-xl mt-3 mb-2"><a href="">Kalendár</a></h1></Link>
      <div className="site-calendar-widget">
        <Calendar fullscreen={false} mode="month" defaultValue={initial} validRange={[moment(CAL_YEAR + "-01-01"), moment(CAL_YEAR + "-12-31")]} headerRender={headerRender} dateCellRender={dateCellRender} onChange={changeHandler} />
      </div>
      <div className="eList">
        {list.length > 0 ? <br /> : null}
       {isLoading ? <Spin /> :
         list.map((e: Event) => {
          return <Ev key={e.id} event={{
            id: e.id,
            name: e.name,
            color: e.color,
            startDate: parseISO(e.startDate.toString()),
            endDate: parseISO(e.endDate.toString())
          }} />
        })
       }
      </div>
    </div>
  )
};

export { CalendarWidget };
