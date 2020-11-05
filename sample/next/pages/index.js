import Head from 'next/head';
import styles from '../styles/Home.module.css';
import dynamic from 'next/dynamic';
const TodoList = dynamic(() => import('./todolist'));

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Replicache + Next.js</title>
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          <a href="https://replicache.dev">Replicache</a> 💜{' '}
          <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.js</code>
        </p>

        <TodoList />
      </main>
    </div>
  );
}
