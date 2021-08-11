import Prismic from '@prismicio/client';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

import { FiCalendar, FiUser } from "react-icons/fi";

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import { useEffect } from 'react';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    setPosts(postsPagination.results);
    setNextPage(postsPagination.next_page);
  }, [postsPagination])

  function handleGetMorePosts() {
    fetch(nextPage)
      .then(resp => resp.json())
      .then(data => {
        const newPosts = data.results.map((post: Post) => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            }
          }
        });
        setPosts([...posts, ...newPosts]);
        setNextPage(data.next_page);
      })
  }

  return (
    <>
      <Header />

      <div className={styles.container}>
        <main className={commonStyles.content}>
          <section className={styles.postsItens}>
            {posts.map((post) => (
              <Link href={`/post/${post.uid}`} key={post.uid}>
                <a>
                  <h2>{post.data.title}</h2>
                  <p>{post.data.subtitle}</p>
                  <div className={styles.info}>
                    <span>
                      <FiCalendar />
                      <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
                    </span>
                    <span>
                      <FiUser />
                      <time>{post.data.author}</time>
                    </span>
                  </div>
                </a>
              </Link>
            ))}
          </section>

          {nextPage !== null && (
            <button onClick={handleGetMorePosts}>
              Carregar mais posts
            </button>
          )}
        </main>
      </div>
    </>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'post')
  ], {
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    pageSize: 2,
  });

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      }
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts
      }
    }
  }
};
