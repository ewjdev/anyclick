export default async function Home() {
  // Force dynamic to avoid prerender issues caused by provider envs during build
  // (App still statically renders UI elements)
  return <>Home Page</>;
}
