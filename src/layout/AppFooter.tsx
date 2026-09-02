import React from 'react';
import { Image, Layout } from 'antd';
import Link from 'next/link';

const { Footer } = Layout;

const AppFooter: React.FC = () => {
  return (
    <Footer className="footer">
      <div className="footerInner">
        <div className="sponsors">
          <Link href={"https://asseco.com"}><Image preview={false} src="/sponzori/Asseco_Poland_Logo.svg" /></Link>
          <Link href={"https://bratislava.sk"}><Image preview={false} src="/sponzori/ba logo.png" /></Link>
          <Link href={"https://www.stilus.sk/sk/"}><Image preview={false} src="/sponzori/LOGO_Stilus_2018.svg" /></Link>
          <Link href={"https://www.sli.do"}><Image preview={false} style={{zIndex: "1000"}} src="/sponzori/slido-logo-c79e792.svg" /></Link>
          <Link href={"https://www.staremesto.sk"}><Image preview={false} style={{margin: "5px -25px", zoom: "2"}} src="/sponzori/SM-Logo-invert.svg" /></Link>
        </div>
      </div>
    </Footer>
  )
}  

export default AppFooter
