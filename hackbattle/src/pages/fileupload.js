import { useState } from 'react';

function ImageUploadForm() {
  const [image, setImage] = useState(null);

  const handleImageChange = (e) => {
    const selectedImage = e.target.files[0];
    setImage(selectedImage);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await fetch('http://127.0.0.1:2000/upload/online', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Handle success
        console.log('Image uploaded successfully');
      } else {
        // Handle error
        console.error('Image upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
      />
      <button type="submit">Upload Image</button>
    </form>
  );
}

export default ImageUploadForm;