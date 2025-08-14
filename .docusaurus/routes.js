import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/hiddendirectory-cantaccess/admin',
    component: ComponentCreator('/hiddendirectory-cantaccess/admin', '74b'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog', '8e2'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/2019/05/28/first-blog-post',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/2019/05/28/first-blog-post', '4e3'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/archive',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/archive', '841'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/authors',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/authors', '287'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/long-blog-post',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/long-blog-post', '35b'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/mdx-blog-post',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/mdx-blog-post', 'bf5'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/tags',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/tags', 'd61'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/tags/docusaurus',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/tags/docusaurus', 'cd1'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/tags/facebook',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/tags/facebook', 'e5e'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/tags/hello',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/tags/hello', '6a9'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/tags/hola',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/tags/hola', 'ac5'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/blog/welcome',
    component: ComponentCreator('/hiddendirectory-cantaccess/blog/welcome', 'd2a'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/contact',
    component: ComponentCreator('/hiddendirectory-cantaccess/contact', '433'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/cookie-test',
    component: ComponentCreator('/hiddendirectory-cantaccess/cookie-test', '190'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/markdown-page',
    component: ComponentCreator('/hiddendirectory-cantaccess/markdown-page', '489'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/privacy-policy',
    component: ComponentCreator('/hiddendirectory-cantaccess/privacy-policy', '312'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/search',
    component: ComponentCreator('/hiddendirectory-cantaccess/search', '05d'),
    exact: true
  },
  {
    path: '/hiddendirectory-cantaccess/docs',
    component: ComponentCreator('/hiddendirectory-cantaccess/docs', '742'),
    routes: [
      {
        path: '/hiddendirectory-cantaccess/docs',
        component: ComponentCreator('/hiddendirectory-cantaccess/docs', '0ad'),
        routes: [
          {
            path: '/hiddendirectory-cantaccess/docs',
            component: ComponentCreator('/hiddendirectory-cantaccess/docs', '312'),
            routes: [
              {
                path: '/hiddendirectory-cantaccess/docs/api-reference',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/api-reference', 'a72'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/api-reference/overview',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/api-reference/overview', '43f'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/guides',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/guides', '3f7'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/guides/overview',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/guides/overview', '3ac'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/intro',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/intro', 'bd1'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics', '3fa'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/congratulations',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/congratulations', 'a62'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-blog-post',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-blog-post', 'b72'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-document',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-document', '038'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-page',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/create-a-page', '874'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/deploy-your-site',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/deploy-your-site', '5ad'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-basics/markdown-features',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-basics/markdown-features', 'acd'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-extras',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-extras', '32c'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-extras/manage-docs-versions',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-extras/manage-docs-versions', 'f22'),
                exact: true,
                sidebar: "tutorialSidebar"
              },
              {
                path: '/hiddendirectory-cantaccess/docs/tutorial-extras/translate-your-site',
                component: ComponentCreator('/hiddendirectory-cantaccess/docs/tutorial-extras/translate-your-site', '9bb'),
                exact: true,
                sidebar: "tutorialSidebar"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/hiddendirectory-cantaccess/',
    component: ComponentCreator('/hiddendirectory-cantaccess/', 'e12'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
