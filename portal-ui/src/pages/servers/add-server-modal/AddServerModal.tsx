import ModalContainer from "@components/shared/modal-container/ModalContainer";

export default function AllServers({
  isModalOpen,
  setIsModalOpen,
}: {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}) {
  return (
    <ModalContainer
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title="Add New Game Server"
      size="md"
    />
  );
}
