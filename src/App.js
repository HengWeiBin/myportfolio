import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React, { useState, useEffect } from 'react';
import { useNavigate, BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from "./Home"
import Certificate from './Certificate';
import { Row, Col, Container } from 'react-bootstrap';

function Navbar() {
    // hamburger button handler
    let [isNavOpen, setIsNavOpen] = useState(false);
    let navButtonHandler = () => setIsNavOpen(!isNavOpen);

    //route handler
    let [isHome, setIsHome] = useState(true);
    let [isCertificate, setIsCertificate] = useState(false);
    let [isPortfolio, setIsPortfolio] = useState(false);
    let [isContactInfo, setIsContactInfo] = useState(false);
    let navigate = useNavigate();
    let navButtonClickHandler = (event) => {
        if (event.target.id === "home_link") {
            setIsHome(true);
            setIsCertificate(false);
            navigate("/");
        }
        else if (event.target.id === "certificate_link") {
            setIsCertificate(true);
            setIsHome(false);
            setIsPortfolio(false);
            navigate("certificate");
        }
    }

    //const navigate = useNavigate();
    // fetch("https://ipinfo.io", {
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Accept': 'application/json'
    //     }
    // }).then(response => response.json())
    //     .then(data => {
    //         console.log(data);
    //         if (data.status !== 429) {
    //             document.getElementById("location").innerText = data.country;
    //         } else {
    //             document.getElementById("location").innerText = 'TW';
    //         }
    //     });

    useEffect(() => {
        async function scrollToPortfolio() {
            if (!/certificate/.test(window.location.href)) {
                window.scroll({
                    top: document.getElementById("profile").getBoundingClientRect().height - 140,
                    behavior: 'smooth'
                });
            } else {
                document.getElementById("home_link").click();
                await new Promise(r => setTimeout(r, 200));
                scrollToPortfolio();
            }
        }

        const onScroll = () => {
            if (!/certificate/.test(window.location.href)) {
                if (document.getElementById("works_area").getBoundingClientRect().y < 100) {
                    setIsPortfolio(true);
                } else {
                    setIsPortfolio(false);
                }
            }
            if (document.getElementById("foot").getBoundingClientRect().y < window.innerHeight * 0.9) {
                setIsContactInfo(true);
            } else {
                setIsContactInfo(false);
            }
        }
        document.getElementById('portfolio_link').addEventListener("click", scrollToPortfolio);
        window.addEventListener("scroll", onScroll);

        return () => {
            document.getElementById('portfolio_link').removeEventListener("click", scrollToPortfolio);
            window.removeEventListener("scroll", onScroll);
        }
    }, []);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark navbar-color fixed-top">
            <button className="navbar-toggler third-button" type="button" data-toggle="collapse"
                data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false"
                aria-label="Toggle navigation" onClick={navButtonHandler}>
                <div className={isNavOpen ? "animated-icon2 open" : "animated-icon3"}><span></span><span></span><span></span></div>
            </button>

            <a className="navbar-brand" href={process.env.PUBLIC_URL}><img src={process.env.PUBLIC_URL + "/img/nav_logo.png"} alt="logo" /></a>

            {/* <!--網頁選單--> */}
            <div className={isNavOpen ? "collapse navbar-collapse show" : "collapse navbar-collapse"} id="navbarSupportedContent">
                <Container>
                    <Row>
                        {/* <!--top icon--> */}
                        <Col className="navbar-nav nav-icon justify-content-end">
                            <Row>
                                <Col as='img' src={process.env.PUBLIC_URL + "/img/icon_where.png"} alt="location" />
                                <Col as='p' id="location" className="text-center">TW</Col>
                            </Row>
                        </Col>
                        <div className="w-100"></div>
                        {/* <!--導航選單--> */}
                        <Col as='ul' className="navbar-nav ml-auto justify-content-end">
                            <li className="nav-item">
                                <button id="home_link" className={"nav-link" + (isHome ? ' nav_clicked' : '')} onClick={navButtonClickHandler}>首頁</button>
                            </li>
                            <li className="nav-item">
                                <button id="portfolio_link" className={"nav-link" + (isPortfolio ? ' nav_clicked' : '')}>作品集</button>
                            </li>
                            <li className="nav-item">
                                <button id="certificate_link" className={"nav-link" + (isCertificate ? ' nav_clicked' : '')} onClick={navButtonClickHandler}>證書集</button>
                            </li>
                            <li className="nav-item">
                                <a id="contact_link" className={"nav-link" + (isContactInfo ? ' nav_clicked' : '')} href="#foot">聯絡方式</a>
                            </li>
                        </Col>
                    </Row>
                </Container>
            </div>
        </nav>
    );
}

function Footer() {
    let [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        function DrawFooterLine(event) {
            let canvas = document.getElementById('line');
            let ctx = canvas.getContext("2d");

            canvas.height = 150;
            canvas.width = 300;

            if (window.innerWidth >= 1200) {
                ctx.beginPath()
                ctx.moveTo(300, 40)
                ctx.lineTo(300, 110)
            }
            else if (window.innerWidth >= 990) {   // draw vertical line in computer webside
                ctx.beginPath()
                ctx.moveTo(230, 40)
                ctx.lineTo(230, 110)
            }
            else if (window.innerWidth >= 768) {   // draw vertical line in tab webside
                ctx.beginPath()
                ctx.moveTo(280, 30)
                ctx.lineTo(280, 130)
            }
            else {   //draw horizontal line in phone website
                canvas.height = 15;
                ctx.beginPath()
                ctx.moveTo(30, 1)
                ctx.lineTo(260, 1)
            }
            ctx.strokeStyle = "white"
            ctx.stroke()

        };

        function updateResize() {
            if (window.innerWidth < 768)
                setIsMobile(true);
            else setIsMobile(false);
        }

        updateResize();
        DrawFooterLine();

        window.addEventListener("resize", updateResize);
        window.addEventListener("resize", DrawFooterLine);

        return () => {
            window.removeEventListener("resize", updateResize);
            window.removeEventListener("resize", DrawFooterLine);
        }
    }, []);

    const mobileComponent = () => (
        <Row as={Col} md={10} className="table_foot_section">
            <Row as={Col} xs={6}>
                <Col as='h2' className='w-100'>認識我</Col>
                <Col as='ul' className='w-100'>
                    <li><a href="https://www.facebook.com/weibin1898/" target="_blank" rel="noreferrer" className='foot_section_link'>Facebook</a></li>
                    <li><a href="https://www.instagram.com/wei_bin/" target="_blank" rel="noreferrer" className='foot_section_link'>Instagram</a></li>
                    <li><a href="https://github.com/HengWeiBin" target="_blank" rel="noreferrer" className='foot_section_link'>Github</a></li>
                    <li><a href={process.env.PUBLIC_URL + "/104.pdf"} target="_blank" rel="noreferrer" className='foot_section_link'>104 履歷</a></li>
                </Col>
            </Row>
            <Row as={Col} xs={6} className="align-items-center">
                <Col as='h2' md={6} className='w-100'>聯係我</Col>
                <Col as='ul' md={6} className='w-100'>
                    <li><a href="mailto:wbsc1898@hotmail.com" className='foot_section_link'>wbsc1898@hotmail.com</a></li>
                    <li id="Tel">Tel: (+886)0916180245</li>
                </Col>
            </Row>
        </Row>
    );

    const desktopComponent = () => (
        <Row as={Col} md={10} className="table_foot_section">
            <Row as={Col} xs={5}>
                <Col as='h2' md={5}>認識我</Col>
                <Col as='ul' md={6}>
                    <li><a href="https://www.facebook.com/weibin1898/" target="_blank" rel="noreferrer" className='foot_section_link'>Facebook</a></li>
                    <li><a href="https://www.instagram.com/wei_bin/" target="_blank" rel="noreferrer" className='foot_section_link'>Instagram</a></li>
                    <li><a href="https://github.com/HengWeiBin" target="_blank" rel="noreferrer" className='foot_section_link'>Github</a></li>
                    <li><a href={process.env.PUBLIC_URL + "/104.pdf"} target="_blank" rel="noreferrer" className='foot_section_link'>104 履歷</a></li>
                </Col>
            </Row>
            <Row as={Col} xs={5} className="align-items-center">
                <Col as='h2' md={5}>聯係我</Col>
                <Col as='ul' md={6}>
                    <li><a href="mailto:wbsc1898@hotmail.com" className='foot_section_link'>wbsc1898@hotmail.com</a></li>
                    <li id="Tel">Tel: (+886)0916180245</li>
                </Col>
            </Row>
        </Row>
    );

    return (
        <footer id="foot">
            <Row className="foot-bg align-items-center">
                <Col md={2}>
                    <Row className="justify-content-center">
                        <img id="foot_logo" src={process.env.PUBLIC_URL + "/img/nav_logo.png"} alt="foot logo" />
                    </Row>
                </Col>
                <canvas id="line"></canvas>
                {isMobile ? mobileComponent() : desktopComponent()}
            </Row>

            <Col as='p' xs={4} md={3}>
                Copyright 2022. All rights reserved.
            </Col>
        </footer>
    )
}

function GoTopButton() {
    let [isShow, setIsShow] = useState(false);

    useEffect(() => {
        function onScroll() {
            if (document.getElementById('root').getBoundingClientRect().y < -500) {
                setIsShow(true);
            } else {
                setIsShow(false);
            }
        }

        function onClick() {
            window.scroll({
                top: 0,
                behavior: 'smooth'
            });
        }

        window.addEventListener("scroll", onScroll);
        document.getElementById("goTopBtn").addEventListener("click", onClick);

        return () => {
            window.removeEventListener("scroll", onScroll);
            document.getElementById("goTopBtn").removeEventListener("click", onClick);
        }
    }, []);
    return (
        <button id="goTopBtn" className={isShow ? '' : 'd-none'} title="Go to top">
            <img src={process.env.PUBLIC_URL + "/img/icon_goTop.png"} alt="Go top button" />
        </button>
    );
}

export default function App() {
    return (
        <>
            <BrowserRouter basename={process.env.PUBLIC_URL === '.' ? '' : process.env.PUBLIC_URL}>
                <Routes>
                    <Route exact path="/" element={
                        <>
                            <Navbar />
                            <GoTopButton />
                            <Home />
                        </>
                    }></Route>
                    <Route exact path="/certificate" element={
                        <>
                            <Navbar />
                            <GoTopButton />
                            <Certificate />
                        </>
                    }></Route>
                </Routes>
            </BrowserRouter>
            <Footer />
        </>
    );
}