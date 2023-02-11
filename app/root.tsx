import type { MetaFunction, LoaderArgs, LinksFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useMatches,
  useTransition
} from '@remix-run/react'
import { useEffect } from 'react'
import NProgress from 'nprogress'
import nProgressStylesUrl from 'nprogress/nprogress.css'

import { getUser } from './session.server'

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'New Remix App',
  viewport: 'width=device-width,initial-scale=1'
})

export let links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: nProgressStylesUrl }]
}

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request)
  })
}

export default function App() {
  let transition = useTransition()
  useEffect(() => {
    if (transition.state === 'idle') NProgress.done()
    else NProgress.start()
  }, [transition.state])

  return (
    <Document>
      <Layout>
        <Outlet />
      </Layout>
    </Document>
  )
}

function Document({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === 'development' && <LiveReload />}
      </body>
    </html>
  )
}

export function CatchBoundary() {
  let caught = useCatch()

  let message
  switch (caught.status) {
    case 401:
      message = 'Oops! Looks like you tried to visit a page that you do not have access to.'

      break
    case 404:
      message = 'Oops! Looks like you tried to visit a page that does not exist.'

      break

    default:
      throw new Error(caught.data || caught.statusText)
  }

  return (
    <Document title={`${caught.status} ${caught.statusText}`}>
      <Layout>
        <div>
          <h1>
            {caught.status}: {caught.statusText}
          </h1>
          <p>{message}</p>
        </div>
      </Layout>
    </Document>
  )
}

function Layout({ children }: React.PropsWithChildren<{}>) {
  let version = useMatches().find((m) => m.id === 'root')?.data?.version

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 bg-white sm:px-10 p-5 border-b">Timer</header>
      <main className="flex-grow">{children}</main>
      <footer className="sm:px-10 p-5">Version {version}</footer>
    </div>
  )
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error)
  return (
    <Document title="Error!">
      <Layout>
        <div>
          <h1>There was an error</h1>
          <p>{error.message}</p>
          <hr />
          <p>Hey, developer, you should replace this with what you want your users to see.</p>
        </div>
      </Layout>
    </Document>
  )
}
