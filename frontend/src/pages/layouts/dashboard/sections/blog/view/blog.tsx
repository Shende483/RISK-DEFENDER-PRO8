import { Helmet } from 'react-helmet-async';

import { CONFIG } from '../../../../../../config-global';
import { BlogView } from './blog-view';

// ----------------------------------------------------------------------

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {`Blog - ${CONFIG.appName}`}</title>
      </Helmet>

      <BlogView />
    </>
  );
}
