import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/client';
import React, { ReactNode, useState } from 'react';
import { Menu, Drawer } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { Authbar } from './Authbar';

type INavbarProps = {
  children?: ReactNode;
  active?: string
};

const Navbar: React.FC<INavbarProps> = (props) => {
  const router = useRouter()
  const [session] = useSession()
  const [open, setOpen] = useState(false)
  const isActive: (pathname: string) => boolean = (pathname) =>
    router.pathname === pathname

  const links = (
    <>
      <Menu.Item key={"home"}>
        <Link href="/">
          <a className="text-bold" data-active={isActive('/')} onClick={() => setOpen(false)}>Novinky</a>
        </Link>
      </Menu.Item>
      <Menu.Item key={"disciplines"}>
        <Link href="/disci">
          <a className="text-bold" data-active={isActive('/disci')} onClick={() => setOpen(false)}>Disciplíny</a>
        </Link>
      </Menu.Item>
      <Menu.Item key={"results"}>
        <Link href="/albums">
          <a className="text-bold" data-active={isActive('/albums')} onClick={() => setOpen(false)}>Fotky</a>
        </Link>
      </Menu.Item>
      {session ? <Menu.Item key={"sifrovacka"}>
        <Link href="/sifrovacka">
          <a className="text-bold" data-active={isActive('/sifrovacka')} onClick={() => setOpen(false)}>Šifrovačka</a>
        </Link>
      </Menu.Item> : null}
      {props.children}
    </>
  )

  return (
    <>
      <div className="navDesktop">
        <Menu mode="horizontal" defaultSelectedKeys={[props.active!]}>
          {links}
        </Menu>
      </div>

      <button type="button" className="navBurger" aria-label="Menu" onClick={() => setOpen(true)}><MenuOutlined /></button>

      <Drawer className="navDrawer" placement="right" width={270} closable={true} onClose={() => setOpen(false)} visible={open}>
        <div className="drawerInner">
          <div className="drawerBrand">
            <img src={`${process.env.baseUrl}/logo-horizont.png`} alt="OH Horizont" />
          </div>
          <Menu mode="vertical" defaultSelectedKeys={[props.active!]}>
            {links}
          </Menu>
          <div className="drawerAuth">
            <Authbar />
          </div>
        </div>
      </Drawer>
    </>
  )
};

export { Navbar };
