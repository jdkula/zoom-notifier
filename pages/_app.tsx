import { AppProps } from "next/app";

import Head from "next/head";

import { ReactElement } from "react";
import { createMuiTheme, ThemeProvider as MuiThemeProvider, CssBaseline, StylesProvider } from "@material-ui/core";
import { createGlobalStyle, ThemeProvider } from "styled-components";
import { SnackbarProvider } from "notistack";

const theme = createMuiTheme({});

export default function App({ Component, pageProps }: AppProps): ReactElement {
    return (
        <>
            <StylesProvider injectFirst>
                <MuiThemeProvider theme={theme}>
                    <ThemeProvider theme={theme}>
                        <Head>
                            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                            <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                            <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                            <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                            <link rel="manifest" href="/site.webmanifest" />
                            <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
                            <meta name="apple-mobile-web-app-title" content="Zoom Notifier" />
                            <meta name="application-name" content="Zoom Notifier" />
                            <meta name="msapplication-TileColor" content="#2b5797" />
                            <meta name="theme-color" content="#ffffff" />
                            <style>{`
                                html {
                                    width: 100%;
                                    height: 100%;
                                }
                                body {
                                    background-color: #4d7ac4;
                                    width: 100%;
                                    height: 100%;
                                    padding: 20px;
                                }
                                #__next {
                                    height: 100%;
                                }
                            `}</style>
                        </Head>
                        <CssBaseline />
                        <SnackbarProvider>
                            <Component {...pageProps} />
                        </SnackbarProvider>
                    </ThemeProvider>
                </MuiThemeProvider>
            </StylesProvider>
        </>
    );
}
