import React, { useState, useEffect } from 'react';
import { css } from '@emotion/css';
import { listNotes } from '../../graphql/queries';
import {
  createNote as createNoteMutation,
  deleteNote as deleteNoteMutation,
} from '../../graphql/mutations';
import { API, Storage, Auth } from 'aws-amplify';

const initialFormState = { name: '', description: '' };

function App() {
  const [notes, setNotes] = useState([]);
  const [formData, setFormData] = useState(initialFormState);

  async function onChange(e) {
    if (!e.target.files[0]) return;
    const file = e.target.files[0];
    setFormData({ ...formData, image: file.name });
    await Storage.put(file.name, file);
    fetchNotes();
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const apiData = await API.graphql({ query: listNotes });
    const notesFromAPI = apiData.data.listNotes.items;
    await Promise.all(
      notesFromAPI.map(async (note) => {
        if (note.image) {
          const image = await Storage.get(note.image);
          note.image = image;
        }
        return note;
      })
    );
    console.log(apiData.data);
    setNotes(apiData.data.listNotes.items);
  }

  async function createNote() {
    if (!formData.name || !formData.description) return;
    await API.graphql({
      query: createNoteMutation,
      variables: { input: formData },
    });
    if (formData.image) {
      const image = await Storage.get(formData.image);
      formData.image = image;
    }
    setNotes([...notes, formData]);
    setFormData(initialFormState);
  }

  async function deleteNote({ id }) {
    const newNotesArray = notes.filter((note) => note.id !== id);
    setNotes(newNotesArray);
    await API.graphql({
      query: deleteNoteMutation,
      variables: { input: { id } },
    });
  }

  return (
    <div className='App'>
      <h1>Hello</h1>
      <input
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder='Note name'
        value={formData.name}
      />
      <input
        onChange={(e) =>
          setFormData({ ...formData, description: e.target.value })
        }
        placeholder='Note description'
        value={formData.description}
      />
      <input type='file' onChange={onChange} />
      <button onClick={createNote}>Create Note</button>
      <div style={{ marginBottom: 30 }}>
        {notes.map((note) => (
          <div key={note.id || note.name}>
            <h2>{note.name}</h2>
            <p>{note.description}</p>
            <button onClick={() => deleteNote(note)}>Delete note</button>
            {note.image && <img src={note.image} style={{ width: 400 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`;
const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`;

export default App;
