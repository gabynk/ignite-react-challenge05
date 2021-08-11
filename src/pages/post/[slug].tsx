import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';

import { FiCalendar, FiUser, FiClock } from "react-icons/fi";

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const amountWordsOfBody = RichText.asText(
    post.data.content.reduce((acc, data) => [...acc, ...data.body], [])
  ).split(' ').length;

  const amountWordsOfHeading = post.data.content.reduce((acc, data) => {
    if (data.heading) {
      return [...acc, ...data.heading.split(' ')];
    }

    return [...acc];
  }, []).length;

  const readingTime = Math.ceil(
    (amountWordsOfBody + amountWordsOfHeading) / 200
  );

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.banner}>
        <img src={post.data.banner.url} alt="Imagem do banner" />
      </div>
      <main className={commonStyles.content}>
        <section className={styles.postsTitle}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <span>
              <FiCalendar />
              <time>{format(new Date(post.first_publication_date), 'dd MMM yyyy', { locale: ptBR })}</time>
            </span>
            <span>
              <FiUser />
              <time>{post.data.author}</time>
            </span>
            <span>
              <FiClock />
              <time>{readingTime} min</time>
            </span>
          </div>
        </section>
        <section className={styles.postContent}>
          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            )
          })}
        </section>
      </main>
    </div>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')]
  );

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return {
    paths,
    fallback: true
  }
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const response = await prismic.getByUID(
    'post',
    String(params.slug),
    {}
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url

      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    }
  }
  return {
    props: {
      post
    }
  }
};
