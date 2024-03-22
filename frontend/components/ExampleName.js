import { React, axios, connect, elements, GenericForm, Modal, GridManager } from 'perun-core'
const { alertUser } = elements
import Type from './Type'
import './style.css'


const ExampleName = ({ session }) => {
    const [data, setData] = React.useState([]);
    const [selectedItem, setSelectedItem] = React.useState(undefined);
    const [selectedSubItem, setSelectedSubItem] = React.useState(undefined);
    const [modal, setModal] = React.useState(undefined);
    const [table, setTableName] = React.useState(null);
    const [openSubmenus, setOpenSubmenus] = React.useState([]);
    const [readOnly, setReadOnly] = React.useState(null);


    const item = selectedSubItem ? selectedSubItem : selectedItem
    const formId = table + '_FORM'
    const gridId = table + '_GRID'


    const hideBtns = !readOnly ? 'close' : 'all'

    const url = window.server + `/WsAdminConsole/get-configuration/sid/${session}/component-name/intern-test-menu`
    React.useEffect(() => {
        axios.get(url)
            .then((response) => {
                setData(response.data.data);
            })
            .catch(error => {
                console.error(error);

                alertUser(true, 'error', error.response?.data?.title || '', error.response?.data?.message || '');

            });
    }, []);

    const handleItemClick = (item) => {


        if (!item.data || item.data.length === 0) {
            setSelectedItem(item);
            setSelectedSubItem(null);


        }

        setReadOnly(item.objectConfiguration?.form?.configuration?.readOnly);
        if (item.data && item.data.length > 0) {
            setOpenSubmenus((prevOpenSubmenus) =>
                prevOpenSubmenus.includes(item.ID)
                    ? prevOpenSubmenus.filter((id) => id !== item.ID)
                    : [...prevOpenSubmenus, item.ID]
            );
        }
    };

    const handleSubItemClick = (subItem) => {

        setSelectedSubItem(subItem);
        setSelectedItem(null)
        setReadOnly(subItem?.objectConfiguration?.form?.configuration?.readOnly);

    };



    React.useEffect(() => {
        console.log("Selected SubItem Changed:", selectedSubItem);
    }, [selectedSubItem]);


    const isSubmenuOpen = (item) => openSubmenus.includes(item.ID);


    React.useEffect(() => {
        if (item) {
            const tableName = getTableNameFromId(item);
            setTableName(tableName);
        }
    }, [item]);



    const closeModal = () => {
        setModal(false)

    }
    const getTableNameFromId = (item) => {
        return item.ID.replace(/_\d+$/, '');

    };

    const onRowClick = (_gridId, _rowId, row) => {

        const tableName = getTableNameFromId(item);
        const objectId = row[`${tableName}.OBJECT_ID`];
        setTableName(tableName);
        showModal(objectId)

    }

    const showModal = (objectId) => {

        if (objectId == null) {
            objectId = 0;
        }
        const saveRecord = (e) => {

            const url = window.server + item?.objectConfiguration?.form?.save?.onSave
            axios({
                method: 'post',
                data: encodeURIComponent(JSON.stringify(e.formData)),
                url,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

            }).
                then(res => {
                    if (res.data) {
                        const resType = res.data.type.toLowerCase()
                        alertUser(true, resType, res.data.title)
                        if (resType === 'success') {
                            closeModal();
                            GridManager.reloadGridData(gridId)
                        }

                    }
                }).catch(error => {


                    alertUser(true, 'error', error.data?.title || '', error.data?.message || '');

                })
        }

        const method = item?.objectConfiguration?.form?.configuration?.onSubmit
        const uiSchema = item?.objectConfiguration?.form?.uischema?.onSubmit;
        const tableFormData = item?.objectConfiguration?.form?.data.onSubmit
            .replace(`{${table}.OBJECT_ID}`, objectId)


        const form = (<GenericForm
            key={formId}
            id={formId}
            method={method}
            uiSchemaConfigMethod={uiSchema}
            tableFormDataMethod={tableFormData}
            addSaveFunction={(e) => saveRecord(e)}
            addDeleteFunction={deleteRecord}
            hideBtns={hideBtns}
            disabled={readOnly}
        />

        );
        const modal = (

            <Modal
                id={item.ID}
                key={item.ID}
                modalContent={form}
                closeModal={closeModal}
                closeAction={closeModal}

            />
        );
        setModal(modal);


    }


    const deleteRecord = (gridId_, tableName, session_, params) => {


        const url = window.server + `/ReactElements/deleteObject/${session}`
        const formData = params[4].PARAM_VALUE
        const data = encodeURIComponent(JSON.stringify(JSON.parse(formData)))

        axios({
            method: 'post',
            data,
            url,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },

        }).
            then(res => {
                const resType = res.data.type.toLowerCase()
                alertUser(true, res.data.type.toLowerCase(), "Record deleted")
                if (resType === 'success') {
                    closeModal();
                    GridManager.reloadGridData(gridId)
                }

            }).catch(error => {
                alertUser(true, error.data.type.toLowerCase(), error.data.message)


            })
    }

    return (
        <>
            <nav className="sidebar-menu">
                <ul className="navbar-nav mr-auto">
                    {data.map((item) => (
                        <li className="nav-item" key={item.id}>
                            <a
                                className={`nav-link ${item.data && item.data.length > 0 ? 'dropdown-toggle' : ''}`}
                                onClick={() => handleItemClick(item)}
                            >
                                {item.label}

                            </a>
                            {isSubmenuOpen(item) && (
                                <div className="dropdown-menu" aria-labelledby={`navbarDropdown${item.id}`}>
                                    {item.data.map((subItem) => (
                                        <a key={subItem.id} className="dropdown-item" onClick={() => handleSubItemClick(subItem, item)}>
                                            {subItem.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </nav>


            <div className='container grid-container'>

                <Type
                    item={selectedSubItem ? selectedSubItem : selectedItem}
                    showModal={showModal}
                    readOnly={readOnly}
                    gridId={gridId}
                    formId={formId}
                    onRowClick={onRowClick}
                />


                {selectedItem && modal || selectedSubItem && modal}
            </div>

        </>
    );
}


const mapStateToProps = (state) => ({
    session: state.security.svSession
});

export default connect(mapStateToProps)(ExampleName)


