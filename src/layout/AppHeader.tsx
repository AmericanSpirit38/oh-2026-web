import React from 'react'
import { Layout, Image } from 'antd';
import { Config } from '../utils/Config'
import { Navbar } from '../components/Navbar'
import { Authbar } from '../components/Authbar'
import Link from 'next/link'

type IHeaderProps = {
  type?: string
  description?: boolean
  active?: string
}

 const { Header } = Layout;

const AppHeader: React.FC<IHeaderProps> = (props) => {

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
      {props.description ? <div className="text-xl">{Config.description}</div> : <></>}
    </Header>
  )
}

export default AppHeader
