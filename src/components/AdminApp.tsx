"use client";

import {
  Admin,
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  ListGuesser,
  PasswordInput,
  ReferenceField,
  ReferenceInput,
  Resource,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";
import authProvider from "~/lib/auth-provider";
import { createDataProvider } from "~/lib/data-provider";

const dataProvider = createDataProvider("/api/model", (url, init) => {
  const auth = localStorage.getItem("auth");
  if (auth) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { token } = JSON.parse(auth);
    if (init.headers instanceof Headers) {
      init.headers.set("Authorization", `Bearer ${token}`);
    } else {
      init.headers = new Headers({ Authorization: `Bearer ${token}` });
    }
  }
  return fetch(url, init);
});

const AdminApp = () => (
  <Admin dataProvider={dataProvider} authProvider={authProvider}>
    <Resource
      name="user"
      list={ListGuesser}
      edit={UserEdit}
      create={UserCreate}
      hasCreate={true}
      recordRepresentation="name"
    />
    <Resource
      name="post"
      list={PostList}
      edit={PostEdit}
      create={PostCreate}
      hasCreate={true}
      recordRepresentation="title"
    />
  </Admin>
);

export const UserCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="email" type="email" validate={required()} />
      <PasswordInput source="password" validate={required()} />
      <TextInput source="name" validate={required()} />
      <SelectInput
        source="role"
        choices={[
          { id: "Author", name: "Author" },
          { id: "Editor", name: "Editor" },
          { id: "Admin", name: "Admin" },
        ]}
        defaultValue={"Author"}
      />
    </SimpleForm>
  </Create>
);

export const UserEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="email" />
      <TextInput source="name" />
      <SelectInput
        source="role"
        choices={[
          { id: "Author", name: "Author" },
          { id: "Editor", name: "Editor" },
          { id: "Admin", name: "Admin" },
        ]}
        defaultValue={"Author"}
      />{" "}
    </SimpleForm>
  </Edit>
);

const PostList = () => (
  <List>
    <Datagrid rowClick="edit">
      <TextField source="id" />
      <TextField source="title" />
      <TextField source="content" />
      <ReferenceField source="userId" reference="user" />
      <TextField source="status" />
      <DateField source="createdAt" />
      <DateField source="updatedAt" />
    </Datagrid>
  </List>
);

export const PostCreate = () => (
  <Create>
    <SimpleForm>
      <ReferenceInput source="userId" reference="user">
        <SelectInput />
      </ReferenceInput>
      <TextInput source="title" validate={required()} />
      <TextInput source="content" multiline rows={5} validate={required()} />
      <SelectInput
        source="status"
        choices={[
          { id: "Draft", name: "Draft" },
          { id: "Submitted", name: "Submitted" },
          { id: "Published", name: "Published" },
        ]}
        defaultValue={"Draft"}
      />
    </SimpleForm>
  </Create>
);

export const PostEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="id" disabled />
      <TextInput source="title" />
      <TextInput source="content" multiline rows={5} />
      <SelectInput
        source="status"
        choices={[
          { id: "Draft", name: "Draft" },
          { id: "Submitted", name: "Submitted" },
          { id: "Published", name: "Published" },
        ]}
        defaultValue={"Draft"}
      />{" "}
    </SimpleForm>
  </Edit>
);

export default AdminApp;
