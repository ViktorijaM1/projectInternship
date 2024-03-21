import { React, ExportableGrid, GenericForm } from 'perun-core'

const Type = ({ item, showModal, readOnly, gridId, onRowClick }) => {


    if (item && item.objectConfiguration && item.objectConfiguration.type === 'grid') {

        return (
            <ExportableGrid
                id={gridId}
                key={gridId}
                configTableName={item.objectConfiguration?.configuration?.onSubmit}
                dataTableName={item.objectConfiguration?.data?.onSubmit}
                onRowClickFunct={onRowClick}
                toggleCustomButton={!readOnly}
                customButton={showModal}
                customButtonLabel='Add'
            />
        );

    } else if (item && item.objectConfiguration && item.objectConfiguration.type === 'form') {
        return (
            <>
                <GenericForm
                    key={gridId}
                    id={gridId}
                    method={item.objectConfiguration.configuration?.onSubmit}
                    uiSchemaConfigMethod={item.objectConfiguration.uischema?.onSubmit}
                    tableFormDataMethod={item.objectConfiguration.data?.onSubmit}
                />
            </>
        );
    } else {
        return null;
    }
};

export default Type;