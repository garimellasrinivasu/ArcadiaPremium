const TallyPage = () => {
  return (
    <div className="h-[calc(100vh-64px)] w-full">
      <iframe
        src="https://in.cloudaccess.tallysolutions.com/login"
        className="w-full h-full border-0"
        title="Tally"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default TallyPage;
