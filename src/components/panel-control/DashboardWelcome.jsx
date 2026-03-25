export default function DashboardWelcome({ data }) {
  return (
    <header className="panel-control-welcome">
      <div>
        <p>{data.eyebrow}</p>
        <h1>{data.title}</h1>
      </div>

      <div className="panel-control-friends">
        {data.friends.map((image, index) => (
          <img alt={`Contacto ${index + 1}`} key={image} src={image} />
        ))}
        <span>+8</span>
      </div>
    </header>
  );
}
