import React from 'react'
import { Layout, Image, Menu } from 'antd';
import { Navbar } from '../components/Navbar'
import { Authbar } from '../components/Authbar'
import Link from 'next/link'
import {Discipline} from '.prisma/client';

type IHeaderProps = {
  setter: Function
  discipline: Discipline & any
  type?: string
  description?: boolean
  active?: string
}

 const { Header } = Layout;

const DisciplineHeader: React.FC<IHeaderProps> = (props) => {
 
  return (
    <Header className="header">
      <div className="topBar">
        <Link href={`${process.env.NEXTAUTH_URL}`}>
          <div className="titleArea">
            <div className="logoMain"><Image preview={false} src={`${process.env.baseUrl}/logo-horizont.png`} alt="OH Horizont" /></div>
          </div>
        </Link>
        <div className="topBarNav"><Navbar active={props.active!} /></div>
        <Authbar />
      </div>
      <div className="discArea">
        <div className="smalllogo"><i className={`oma oma-5x ${props.discipline.icon ? props.discipline.icon : (props.discipline.category?.icon ? props.discipline.category?.icon : "oma-black-red-question-mark")}`} /></div>
        <h2>{props.discipline.name}</h2>
        <Menu mode="horizontal">
          <Menu.Item key="info">
            <a onClick={() => props.setter(0)}>Informácie</a>
          </Menu.Item>
          <Menu.Item key="results">
          <a onClick={() => props.setter(1)}>Výsledky</a>
          </Menu.Item>
        </Menu>
      </div>
      
    </Header>
  )
}

export default DisciplineHeader
