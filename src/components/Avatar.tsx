const Avatar = ({ address }: { address: string }) => {
  const baseUrl = 'https://api.dicebear.com/9.x/identicon/svg?seed=';
  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl p-1 shadow-2xl">
      <img src={`${baseUrl}${address}`} alt="avatar" className="w-[42px] h-[42px] rounded-lg" />
    </div>
  );
};

export default Avatar;
