import { href } from '../router';

export function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <div className="page">
      <h1>That {what} isn't here</h1>
      <p>It may not have been written yet. <a href={href('/curriculum')}>Browse the curriculum</a> or <a href={href('/')}>go home</a>.</p>
    </div>
  );
}
