const Avatar = ({ address }: { address: string }) => {
  const baseUrl = 'https://api.dicebear.com/9.x/shapes/svg?seed=';
  return (
    <div className="">
      <img src={`${baseUrl}${address}`} alt="avatar" className="w-[42px] h-[42px] rounded-lg" />
    </div>
  );
};

export default Avatar;
